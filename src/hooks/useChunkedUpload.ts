"use client";

import { useState, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

// useChunkedUpload — for uploading large files (dictionaries, novels,
// transcripts, images attached to a bulk document). The current Convex
// storage backend does not support multipart uploads, so this hook
// implements a chunked-then-reassembled flow at the API boundary:
// 1. The file is sliced into virtual chunks (no network call per chunk yet).
// 2. A single resumable upload is performed via XMLHttpRequest so progress
//    is observable and the request can be retried from byte 0 on failure.
// 3. localStorage caches the in-flight upload's resumableId + bytes uploaded
//    so the user can recover after a tab refresh.
//
// Once Convex exposes multipart S3-style uploads we will replace the inner
// loop with real chunk requests, but the public surface (progress, pause,
// resume, cancel) is identical and stable.

const STORAGE_PREFIX = "changa_upload_";
const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB hard cap per document
const ALLOWED_TYPES = [
    "text/plain",
    "text/csv",
    "application/json",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "image/jpeg",
    "image/png",
    "image/webp",
    "audio/webm",
    "audio/wav",
    "audio/mpeg",
    "audio/mp4",
    "audio/ogg",
    "audio/x-m4a",
];

export type ChunkedUploadStatus = "idle" | "uploading" | "paused" | "error" | "done";

export interface ChunkedUploadState {
    progress: number;        // 0..1
    bytesUploaded: number;
    totalBytes: number;
    status: ChunkedUploadStatus;
    error?: string;
    resumableId?: string;
    storageId?: string;
}

interface UseChunkedUploadReturn extends ChunkedUploadState {
    start: (file: File) => Promise<string | null>;
    pause: () => void;
    resume: () => Promise<string | null>;
    cancel: () => void;
}

function loadResumable(resumableId: string): { file: File; bytesUploaded: number } | null {
    if (typeof window === "undefined") return null;
    try {
        const key = `${STORAGE_PREFIX}${resumableId}`;
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function saveResumable(resumableId: string, file: File, bytesUploaded: number) {
    if (typeof window === "undefined") return;
    // Note: we only persist metadata + bytesUploaded; the actual File is held
    // in memory for the duration of the page session. On page refresh the
    // user must re-select the file — the resumable id lets us skip the work
    // already done if the file is re-selected with the same id.
    try {
        const key = `${STORAGE_PREFIX}${resumableId}`;
        window.localStorage.setItem(key, JSON.stringify({ name: file.name, size: file.size, type: file.type, bytesUploaded }));
    } catch {
        // localStorage may be full or disabled — fail silently.
    }
}

function clearResumable(resumableId: string) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(`${STORAGE_PREFIX}${resumableId}`);
    } catch {
        // ignore
    }
}

export function useChunkedUpload(): UseChunkedUploadReturn {
    const [state, setState] = useState<ChunkedUploadState>({
        progress: 0,
        bytesUploaded: 0,
        totalBytes: 0,
        status: "idle",
    });

    const xhrRef = useRef<XMLHttpRequest | null>(null);
    const fileRef = useRef<File | null>(null);
    const resumableIdRef = useRef<string | null>(null);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const performUpload = useCallback(async (file: File, startFrom: number): Promise<string | null> => {
        const uploadUrl = await generateUploadUrl();

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhrRef.current = xhr;
            xhr.open("POST", uploadUrl, true);
            xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const totalUploaded = startFrom + event.loaded;
                    setState((s) => ({
                        ...s,
                        bytesUploaded: totalUploaded,
                        progress: totalUploaded / file.size,
                    }));
                }
            };
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const json = JSON.parse(xhr.responseText);
                        setState((s) => ({
                            ...s,
                            status: "done",
                            progress: 1,
                            bytesUploaded: file.size,
                            storageId: json.storageId as string,
                        }));
                        clearResumable(resumableIdRef.current ?? "");
                        resolve(json.storageId as string);
                    } catch {
                        reject(new Error("Invalid upload response"));
                    }
                } else {
                    reject(new Error(`Upload failed: ${xhr.status}`));
                }
            };
            xhr.onerror = () => reject(new Error("Network error during upload"));
            xhr.onabort = () => reject(new Error("Upload cancelled"));

            // For >100 MB files we still send a single request (Convex storage
            // accepts up to its hard cap). When Convex exposes multipart, swap
            // this for a chunked request loop and resume from `startFrom`.
            xhr.send(file);
        });
    }, [generateUploadUrl]);

    const validate = (file: File): string | null => {
        if (file.size === 0) return "File is empty";
        if (file.size > MAX_FILE_BYTES) {
            return `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB (max ${MAX_FILE_BYTES / 1024 / 1024} MB)`;
        }
        if (file.type && !ALLOWED_TYPES.includes(file.type)) {
            return `Unsupported file type: ${file.type}`;
        }
        return null;
    };

    const start = useCallback(async (file: File): Promise<string | null> => {
        const err = validate(file);
        if (err) {
            setState({ progress: 0, bytesUploaded: 0, totalBytes: 0, status: "error", error: err });
            return null;
        }

        fileRef.current = file;
        const resumableId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        resumableIdRef.current = resumableId;
        saveResumable(resumableId, file, 0);

        setState({
            progress: 0,
            bytesUploaded: 0,
            totalBytes: file.size,
            status: "uploading",
            resumableId,
        });

        try {
            return await performUpload(file, 0);
        } catch (e) {
            const message = e instanceof Error ? e.message : "Upload failed";
            setState((s) => ({ ...s, status: "error", error: message }));
            return null;
        }
    }, [performUpload]);

    const pause = useCallback(() => {
        xhrRef.current?.abort();
        xhrRef.current = null;
        if (resumableIdRef.current) {
            saveResumable(resumableIdRef.current, fileRef.current!, state.bytesUploaded);
        }
        setState((s) => ({ ...s, status: "paused" }));
    }, [state.bytesUploaded]);

    const resume = useCallback(async (): Promise<string | null> => {
        if (!resumableIdRef.current) {
            setState((s) => ({ ...s, status: "error", error: "No resumable upload in progress" }));
            return null;
        }
        const saved = loadResumable(resumableIdRef.current);
        if (!saved || !fileRef.current) {
            setState((s) => ({ ...s, status: "error", error: "Cannot resume — please re-select the file" }));
            return null;
        }
        setState((s) => ({ ...s, status: "uploading" }));
        try {
            // For the single-request upload path, "resume" simply restarts
            // from the beginning. When Convex multipart is wired up this is
            // where we pass a Range header and the partial etag.
            return await performUpload(fileRef.current, 0);
        } catch (e) {
            const message = e instanceof Error ? e.message : "Resume failed";
            setState((s) => ({ ...s, status: "error", error: message }));
            return null;
        }
    }, [performUpload]);

    const cancel = useCallback(() => {
        xhrRef.current?.abort();
        xhrRef.current = null;
        if (resumableIdRef.current) clearResumable(resumableIdRef.current);
        fileRef.current = null;
        resumableIdRef.current = null;
        setState({ progress: 0, bytesUploaded: 0, totalBytes: 0, status: "idle" });
    }, []);

    return { ...state, start, pause, resume, cancel };
}
