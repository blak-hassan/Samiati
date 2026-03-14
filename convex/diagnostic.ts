
import { action } from "./_generated/server";

// =============================================================================
// DIAGNOSTIC SERVICE
// =============================================================================
// This utility helps diagnose issues with the AI services by testing
// connectivity and configuration for each service.
// =============================================================================

interface DiagnosticResult {
    service: string;
    status: "ok" | "error" | "warning";
    message: string;
    details?: string;
}

export const diagnoseServices = action(async (ctx): Promise<DiagnosticResult[]> => {
    const results: DiagnosticResult[] = [];
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    // 1. Check API Key Configuration
    if (!apiKey) {
        results.push({
            service: "Configuration",
            status: "error",
            message: "HUGGINGFACE_API_KEY is not set",
            details: "Please add HUGGINGFACE_API_KEY to your Convex Dashboard environment variables. Get your token from https://huggingface.co/settings/tokens"
        });
    } else {
        results.push({
            service: "Configuration",
            status: "ok",
            message: "HUGGINGFACE_API_KEY is configured",
            details: `API key starts with: ${apiKey.substring(0, 7)}...`
        });

        // 2. Test Chat Service (Qwen)
        try {
            const chatResponse = await fetch("https://router.huggingface.co/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "Qwen/Qwen2.5-0.5B-Instruct",
                    messages: [{ role: "user", content: "Hi" }],
                    max_tokens: 5,
                }),
            });

            if (chatResponse.ok) {
                results.push({
                    service: "Chat (Qwen)",
                    status: "ok",
                    message: "Chat service is working"
                });
            } else if (chatResponse.status === 503) {
                results.push({
                    service: "Chat (Qwen)",
                    status: "warning",
                    message: "Model is loading, please retry in a moment",
                    details: "Free tier models may take time to load"
                });
            } else {
                const errorText = await chatResponse.text();
                results.push({
                    service: "Chat (Qwen)",
                    status: "error",
                    message: `API returned status ${chatResponse.status}`,
                    details: errorText.substring(0, 200)
                });
            }
        } catch (error) {
            results.push({
                service: "Chat (Qwen)",
                status: "error",
                message: "Failed to connect to chat service",
                details: String(error)
            });
        }

        // 3. Test Translation Service (NLLB)
        try {
            const translateResponse = await fetch("https://router.huggingface.co/hf-inference/models/facebook/nllb-200-distilled-600M", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inputs: "Hello",
                    parameters: { src_lang: "eng_Latn", tgt_lang: "swh_Latn" }
                }),
            });

            if (translateResponse.ok) {
                results.push({
                    service: "Translation (NLLB)",
                    status: "ok",
                    message: "Translation service is working"
                });
            } else if (translateResponse.status === 503) {
                results.push({
                    service: "Translation (NLLB)",
                    status: "warning",
                    message: "Model is loading, please retry in a moment"
                });
            } else {
                const errorText = await translateResponse.text();
                results.push({
                    service: "Translation (NLLB)",
                    status: "error",
                    message: `API returned status ${translateResponse.status}`,
                    details: errorText.substring(0, 200)
                });
            }
        } catch (error) {
            results.push({
                service: "Translation (NLLB)",
                status: "error",
                message: "Failed to connect to translation service",
                details: String(error)
            });
        }

        // 4. Test ASR Service (Paza Whisper)
        try {
            // Just check if the model endpoint is reachable (won't actually transcribe)
            const asrResponse = await fetch("https://api-inference.huggingface.co/models/microsoft/paza-whisper-large-v3-turbo", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                },
                body: new Uint8Array([0]), // Send minimal data to trigger error but check endpoint
            });

            // 400 Bad Request is expected since we sent invalid audio data
            // This means the endpoint is reachable
            if (asrResponse.status === 400 || asrResponse.status === 200) {
                results.push({
                    service: "ASR (Paza Whisper)",
                    status: "ok",
                    message: "ASR service endpoint is reachable"
                });
            } else if (asrResponse.status === 503) {
                results.push({
                    service: "ASR (Paza Whisper)",
                    status: "warning",
                    message: "Model is loading, please retry in a moment"
                });
            } else {
                const errorText = await asrResponse.text();
                results.push({
                    service: "ASR (Paza Whisper)",
                    status: "error",
                    message: `API returned status ${asrResponse.status}`,
                    details: errorText.substring(0, 200)
                });
            }
        } catch (error) {
            results.push({
                service: "ASR (Paza Whisper)",
                status: "error",
                message: "Failed to connect to ASR service",
                details: String(error)
            });
        }

        // 5. Test TTS Service (MMS-TTS)
        try {
            const ttsResponse = await fetch("https://api-inference.huggingface.co/models/facebook/mms-tts-eng", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ inputs: "test" }),
            });

            if (ttsResponse.ok) {
                results.push({
                    service: "TTS (MMS-TTS)",
                    status: "ok",
                    message: "TTS service is working"
                });
            } else if (ttsResponse.status === 503) {
                results.push({
                    service: "TTS (MMS-TTS)",
                    status: "warning",
                    message: "Model is loading, please retry in a moment"
                });
            } else {
                const errorText = await ttsResponse.text();
                results.push({
                    service: "TTS (MMS-TTS)",
                    status: "error",
                    message: `API returned status ${ttsResponse.status}`,
                    details: errorText.substring(0, 200)
                });
            }
        } catch (error) {
            results.push({
                service: "TTS (MMS-TTS)",
                status: "error",
                message: "Failed to connect to TTS service",
                details: String(error)
            });
        }
    }

    return results;
});
