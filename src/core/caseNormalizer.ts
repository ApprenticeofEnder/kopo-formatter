/**
 * Keyword case normalization for COBOL source text.
 *
 * Transforms COBOL reserved words to a target case (upper or lower) while
 * leaving user-defined names (data names, paragraph names) and string
 * literals completely untouched.
 */

import { type FormatterOptions } from "./options.js";
import { COBOL_RESERVED_WORDS } from "./constants.js";

/**
 * Normalize the case of COBOL reserved words in a piece of text.
 *
 * - Reserved words are looked up case-insensitively against COBOL_RESERVED_WORDS.
 * - User-defined names (data names, paragraph names) are not in the set and
 *   are preserved as-is.
 * - Text inside string literals ('...' or "...") is passed through verbatim.
 * - Hyphens are treated as part of a word token (COBOL identifiers use them),
 *   so "WORKING-STORAGE" is looked up as a single token.
 */
export function normalizeKeywords(
    text: string,
    targetCase: "upper" | "lower",
    reserved: Set<string> = COBOL_RESERVED_WORDS,
): string {
    const result: string[] = [];
    let i = 0;

    while (i < text.length) {
        const ch = text[i];

        // String literal — pass through verbatim including content
        if (ch === "'" || ch === '"') {
            const quote = ch;
            result.push(ch);
            i++;
            while (i < text.length) {
                const c = text[i];
                result.push(c);
                i++;
                if (c === quote) break;
            }
            continue;
        }

        // Word token: letters, digits, hyphens (COBOL identifiers)
        // Note: a leading hyphen is not part of a word (arithmetic operator)
        if (isWordStart(ch)) {
            const start = i;
            while (i < text.length && isWordContinue(text[i])) {
                i++;
            }
            // Strip trailing hyphens (e.g. "WORKING-" shouldn't match)
            let end = i;
            while (end > start && text[end - 1] === "-") end--;

            const token = text.substring(start, end);
            const trailing = text.substring(end, i);

            if (reserved.has(token.toUpperCase())) {
                result.push(targetCase === "upper" ? token.toUpperCase() : token.toLowerCase());
            } else {
                result.push(token);
            }
            result.push(trailing);
            continue;
        }

        // Everything else (spaces, punctuation, operators) — pass through
        result.push(ch);
        i++;
    }

    return result.join("");
}

/**
 * Apply keyword case normalization if the option is not "preserve".
 * This is the main entry point used by the printer.
 */
export function applyCase(text: string, options: FormatterOptions): string {
    if (options.keywordCase === "preserve") return text;
    return normalizeKeywords(text, options.keywordCase);
}

function isWordStart(ch: string): boolean {
    return /[A-Za-z]/.test(ch);
}

function isWordContinue(ch: string): boolean {
    return /[A-Za-z0-9-]/.test(ch);
}
