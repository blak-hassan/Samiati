/**
 * Sentence windowing for streaming translation.
 *
 * A translation model translates a whole string at a time, so a reply would
 * normally arrive in the user's language only after the model had finished
 * writing it in English. That is a long wait.
 *
 * The fix is to translate the answer in pieces: as the English answer grows,
 * each completed sentence is translated on its own and the translations are
 * emitted in order. The user reads their own language while the model is
 * still writing.
 *
 * The window has to be careful about where a sentence ends. A full stop inside
 * an abbreviation, a decimal number or a URL must not end a sentence.
 */

/** Abbreviations that end in a full stop but do not end a sentence. */
const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "vs", "etc", "eg",
  "ie", "no", "approx", "dept", "est", "fig", "al", "inc", "ltd", "co",
  "e.g", "i.e", "a.m", "p.m", "u.s", "u.k",
]);

export interface SentenceWindowOptions {
  /**
   * The smallest fragment worth translating on its own. Very short fragments
   * translate badly and cost a request, so they are held back.
   */
  minCharacters?: number;
}

/**
 * Accumulates text and releases it one complete sentence at a time.
 */
export class SentenceWindow {
  private buffer = "";
  private readonly minCharacters: number;

  constructor(options: SentenceWindowOptions = {}) {
    this.minCharacters = options.minCharacters ?? 10;
  }

  /**
   * Feeds a chunk of text and returns any sentences that are now complete.
   *
   * A trailing fragment is held back until more text arrives, or until
   * {@link flush} is called at the end of the stream.
   */
  push(chunk: string): string[] {
    this.buffer += chunk;

    const sentences: string[] = [];
    let cursor = 0;

    for (let index = 0; index < this.buffer.length; index += 1) {
      const character = this.buffer[index]!;

      if (!isSentenceTerminator(character)) continue;

      // Consume any run of terminators and the whitespace after them.
      let end = index + 1;
      while (end < this.buffer.length && isSentenceTerminator(this.buffer[end]!)) {
        end += 1;
      }
      while (end < this.buffer.length && /\s/.test(this.buffer[end]!)) {
        end += 1;
      }

      const candidate = this.buffer.slice(cursor, end).trim();
      if (!candidate) {
        cursor = end;
        index = end - 1;
        continue;
      }

      if (!isTerminatedSentence(candidate)) {
        // An abbreviation or a decimal — keep looking.
        continue;
      }

      if (candidate.length < this.minCharacters) {
        // Too short to translate well on its own; hold it.
        continue;
      }

      sentences.push(candidate);
      cursor = end;
      index = end - 1;
    }

    if (cursor > 0) {
      this.buffer = this.buffer.slice(cursor);
    }

    return sentences;
  }

  /** Returns whatever is left, for the end of the stream. */
  flush(): string[] {
    const remainder = this.buffer.trim();
    this.buffer = "";
    return remainder ? [remainder] : [];
  }

  /** True when nothing is waiting to be translated. */
  get isEmpty(): boolean {
    return this.buffer.trim().length === 0;
  }
}

/** Characters that can end a sentence. */
function isSentenceTerminator(character: string): boolean {
  return character === "." || character === "!" || character === "?" || character === "…";
}

/**
 * Decides whether a fragment really ends a sentence.
 *
 * Rejects fragments that end in a known abbreviation, and fragments where the
 * full stop is part of a number or a URL.
 */
export function isTerminatedSentence(fragment: string): boolean {
  const trimmed = fragment.trim();
  if (!trimmed) return false;

  const terminatorIndex = Math.max(
    trimmed.lastIndexOf("."),
    trimmed.lastIndexOf("!"),
    trimmed.lastIndexOf("?"),
  );
  if (terminatorIndex === -1) return false;

  // A URL or a path: "example.org/guides" or "3.14".
  const afterTerminator = trimmed.slice(terminatorIndex + 1).trim();
  if (afterTerminator.length > 0) return false;

  // A decimal number: the full stop sits between two digits.
  const beforeTerminator = trimmed.slice(0, terminatorIndex);
  if (/[0-9]$/.test(beforeTerminator) && /^[0-9]/.test(afterTerminator || " ")) {
    return false;
  }

  // An abbreviation: "Dr." "e.g." "etc."
  const lastWord = beforeTerminator.split(/[\s(]/).pop()?.toLowerCase() ?? "";
  if (lastWord && ABBREVIATIONS.has(lastWord)) return false;

  // A single capital letter followed by a full stop is an initial: "A." "J."
  if (/^[A-Za-z]$/.test(lastWord)) return false;

  return true;
}

/**
 * Splits a complete text into sentences.
 *
 * Used by the dataset pipeline, where the whole text is already available.
 */
export function splitSentences(text: string): string[] {
  const window = new SentenceWindow({ minCharacters: 0 });
  const sentences = window.push(text);
  sentences.push(...window.flush());
  return sentences.filter((sentence) => sentence.length > 0);
}
