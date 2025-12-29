// Test translation directly
import { api } from "./convex/_generated/api";

async function testTranslation() {
    const testText = "Hello, how are you today?";
    const targetLang = "swh_Latn"; // Swahili

    console.log("Testing translation...");
    console.log("Input:", testText);
    console.log("Target language:", targetLang);

    try {
        // This won't work outside Convex runtime, but shows the structure
        console.log("Translation test would call:", {
            text: testText,
            targetLanguage: targetLang
        });
    } catch (error) {
        console.error("Test error:", error);
    }
}

testTranslation();
