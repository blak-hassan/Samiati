import { useState, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface UseUploadFileReturn {
    upload: (blob: Blob) => Promise<string | null>;
    isUploading: boolean;
    error: string | null;
    progress: number;       // 0..1
    bytesUploaded: number;
    cancel: () => void;
}

export function useUploadFile(): UseUploadFileReturn {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [bytesUploaded, setBytesUploaded] = useState(0);
    const xhrRef = useRef<XMLHttpRequest | null>(null);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const cancel = useCallback(() => {
        xhrRef.current?.abort();
        xhrRef.current = null;
        setIsUploading(false);
        setProgress(0);
        setBytesUploaded(0);
    }, []);

    const upload = useCallback(async (blob: Blob): Promise<string | null> => {
        setIsUploading(true);
        setError(null);
        setProgress(0);
        setBytesUploaded(0);

        try {
            const uploadUrl = await generateUploadUrl();

            // Use XMLHttpRequest so we can listen to progress events (the
            // fetch() API does not expose upload progress in browsers).
            const storageId = await new Promise<string | null>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhrRef.current = xhr;
                xhr.open("POST", uploadUrl, true);
                xhr.setRequestHeader("Content-Type", blob.type || "application/octet-stream");
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        setProgress(event.loaded / event.total);
                        setBytesUploaded(event.loaded);
                    }
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const json = JSON.parse(xhr.responseText);
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
                xhr.send(blob);
            });

            setProgress(1);
            return storageId;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Upload failed";
            setError(message);
            return null;
        } finally {
            setIsUploading(false);
            xhrRef.current = null;
        }
    }, [generateUploadUrl]);

    return { upload, isUploading, error, progress, bytesUploaded, cancel };
}
