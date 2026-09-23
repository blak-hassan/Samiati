
import React, { useState, useRef, useCallback } from 'react';
import { useChangaMutation as useMutation } from "@/hooks/useChangaData";
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import UploadProgressBar from '../UploadProgressBar';

interface BatchEntry {
    id: string;
    value: string;
}

interface BatchTextEntryProps {
    placeholder?: string;
    onSubmit?: (entries: string[]) => void;
    /**
     * When provided, the component will create a private document and submit
     * entries via the bulk mutation instead of returning strings to the
     * parent. This is the recommended path for dictionary / corpus uploads.
     */
    documentTitle?: string;
    languageCode?: string;
    onComplete?: (result: { documentId: Id<"changaDocuments">; added: number; skipped: number }) => void;
}

const BATCH_SIZE = 500;

const BatchTextEntry: React.FC<BatchTextEntryProps> = ({
    placeholder = 'Type your entry here...',
    onSubmit,
    documentTitle,
    languageCode,
    onComplete,
}) => {
    const [entries, setEntries] = useState<BatchEntry[]>([{ id: '1', value: '' }]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [added, setAdded] = useState(0);
    const [skipped, setSkipped] = useState(0);

    const createDocument = useMutation(api.changa.documents.createDocument);
    const bulkAdd = useMutation(api.changa.documents.bulkAddDocumentEntries);
    const cancelRef = useRef(false);

    const addEntry = () => {
        setEntries([...entries, { id: Math.random().toString(36).slice(2, 9), value: '' }]);
    };

    const removeEntry = (id: string) => {
        if (entries.length <= 1) return;
        setEntries(entries.filter((e) => e.id !== id));
    };

    const updateEntry = (id: string, value: string) => {
        setEntries(entries.map((e) => (e.id === id ? { ...e, value } : e)));
    };

    const validEntries = entries.filter((e) => e.value.trim().length > 0);
    const totalWords = validEntries.reduce((sum, e) => sum + e.value.trim().split(/\s+/).length, 0);

    const submitToParent = () => {
        if (onSubmit) onSubmit(validEntries.map((e) => e.value.trim()));
    };

    const submitAsBulk = useCallback(async () => {
        if (!documentTitle || !languageCode) {
            setError('Document title and language are required for bulk upload');
            return;
        }
        cancelRef.current = false;
        setError(null);
        setIsSubmitting(true);
        setProgress(0);
        setAdded(0);
        setSkipped(0);
        try {
            const documentId = await createDocument({
                title: documentTitle,
                kind: 'dictionary',
                languageCode,
                totalEntries: validEntries.length,
            });
            const all: { index: number; sourceText: string; clientIdempotencyKey: string }[] = validEntries.map((e, i) => ({
                index: i,
                sourceText: e.value.trim(),
                clientIdempotencyKey: `${documentId}:${i}`,
            }));

            let totalAdded = 0;
            let totalSkipped = 0;
            for (let i = 0; i < all.length; i += BATCH_SIZE) {
                if (cancelRef.current) {
                    setError('Upload cancelled');
                    break;
                }
                const batch = all.slice(i, i + BATCH_SIZE);
                const result = await bulkAdd({ documentId, entries: batch });
                totalAdded += result.added;
                totalSkipped += result.skipped;
                setAdded(totalAdded);
                setSkipped(totalSkipped);
                setProgress(Math.min(1, (i + batch.length) / all.length));
            }
            if (onComplete) onComplete({ documentId, added: totalAdded, skipped: totalSkipped });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Upload failed';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    }, [documentTitle, languageCode, validEntries, createDocument, bulkAdd, onComplete]);

    const submit = () => {
        if (documentTitle && languageCode) {
            submitAsBulk();
        } else {
            submitToParent();
        }
    };

    const cancel = () => {
        cancelRef.current = true;
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 dark:text-white">Batch Entries</h3>
                <span className="text-xs font-bold text-stone-400">
                    {validEntries.length} entries &bull; {totalWords} words
                </span>
            </div>

            {isSubmitting && (
                <UploadProgressBar
                    progress={progress}
                    bytesUploaded={added}
                    totalBytes={validEntries.length}
                    status={error ? 'error' : 'uploading'}
                    error={error ?? undefined}
                    label={`Importing entries — ${added}/${validEntries.length}`}
                    onCancel={cancel}
                />
            )}

            {!isSubmitting && (
                <>
                    <div className="space-y-3">
                        {entries.map((entry, index) => (
                            <div key={entry.id} className="flex items-start gap-2 group">
                                <span className="w-6 h-6 rounded-full bg-stone-100 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-stone-400 shrink-0 mt-3">
                                    {index + 1}
                                </span>
                                <textarea
                                    value={entry.value}
                                    onChange={(e) => updateEntry(entry.id, e.target.value)}
                                    placeholder={`${placeholder} #${index + 1}`}
                                    rows={2}
                                    className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/10 outline-none focus:border-[#cf6317] text-stone-900 dark:text-white placeholder-stone-300 resize-none text-sm transition-colors"
                                />
                                {entries.length > 1 && (
                                    <button
                                        onClick={() => removeEntry(entry.id)}
                                        className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 mt-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">close</span>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addEntry}
                        className="w-full py-3 rounded-xl border-2 border-dashed border-stone-300 dark:border-white/20 text-stone-500 font-bold text-sm hover:border-[#cf6317] hover:text-[#cf6317] transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Add Another Entry
                    </button>
                </>
            )}

            {!isSubmitting && validEntries.length > 0 && (
                <button
                    onClick={submit}
                    className="w-full bg-[#cf6317] hover:bg-[#b05210] text-white font-bold py-3 rounded-xl shadow-lg active:scale-[0.98] transition-all"
                >
                    {documentTitle && languageCode
                        ? `Import ${validEntries.length} Entries`
                        : `Submit ${validEntries.length} Entries`}
                </button>
            )}

            {error && !isSubmitting && (
                <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
            {!isSubmitting && added > 0 && (
                <p className="text-sm text-green-600 font-medium">
                    Imported {added} entries{skipped > 0 ? ` (${skipped} duplicates skipped)` : ''}.
                </p>
            )}
        </div>
    );
};

export default BatchTextEntry;
