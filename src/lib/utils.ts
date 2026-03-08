import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Copies text to the clipboard with a fallback for non-secure contexts (HTTP).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try the modern Clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error("Clipboard API failed:", err);
    }
  }

  // Fallback to older execCommand('copy') - improved for mobile/Safari
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Ensure the textarea is part of the DOM and editable for certain mobile browsers
    textArea.contentEditable = "true";
    textArea.readOnly = false;

    // Position it off-screen
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);

    // Select the text
    if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
      // iOS specific selection
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textArea.setSelectionRange(0, 999999);
    } else {
      textArea.focus();
      textArea.select();
    }

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Fallback copy failed:", err);
    return false;
  }
}
