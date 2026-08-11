import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface UseUploadFileReturn {
    upload: (blob: Blob) => Promise<string | null>;
    isUploading: boolean;
    error: string | null;
}

export function useUploadFile(): UseUploadFileReturn {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const upload = useCallback(async (blob: Blob): Promise<string | null> => {
        setIsUploading(true);
        setError(null);

        try {
            const uploadUrl = await generateUploadUrl();
            const response = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": blob.type || "application/octet-stream" },
                body: blob,
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }

            const { storageId } = await response.json();
            return storageId as string;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Upload failed";
            setError(message);
            return null;
        } finally {
            setIsUploading(false);
        }
    }, [generateUploadUrl]);

    return { upload, isUploading, error };
}
