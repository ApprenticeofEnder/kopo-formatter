/**
 * Format-aware scanner that converts raw COBOL source into logical source lines.
 *
 * The scanner handles:
 * - Fixed-form column structure (cols 1-6 seq, col 7 indicator, cols 8-72 text, cols 73-80 id)
 * - Free-form source (entire line is program text)
 * - Comment detection
 * - Continuation line joining
 * - Tab-to-space conversion
 */

import { type SourceLine } from "./tokens.js";
import { type SourceFormat } from "./formatDetector.js";
import { SEQ_NUMBER_END, PROGRAM_TEXT_END } from "./constants.js";

/**
 * Expand tabs using 8-column tab stops (standard for fixed-form COBOL).
 */
function expandTabs(line: string): string {
    let result = "";
    let col = 0;
    for (const ch of line) {
        if (ch === "\t") {
            const spaces = 8 - (col % 8);
            result += " ".repeat(spaces);
            col += spaces;
        } else {
            result += ch;
            col++;
        }
    }
    return result;
}

/**
 * Scan raw source text into logical source lines.
 */
export function scan(source: string, format: SourceFormat): SourceLine[] {
    const rawLines = source.split(/\r?\n/);

    if (format === "fixed") {
        return scanFixedForm(rawLines);
    } else {
        return scanFreeForm(rawLines);
    }
}

function scanFixedForm(rawLines: string[]): SourceLine[] {
    const result: SourceLine[] = [];

    for (let i = 0; i < rawLines.length; i++) {
        const original = expandTabs(rawLines[i]);
        const originalText = rawLines[i];

        // Blank line
        if (!original.trim()) {
            result.push({
                text: "",
                originalLine: i,
                isComment: false,
                isBlank: true,
                indicator: " ",
                originalText,
            });
            continue;
        }

        // Extract indicator (col 7, 0-based index 6)
        const indicator = original.length > SEQ_NUMBER_END ? original.charAt(SEQ_NUMBER_END) : " ";

        // Comment lines (* or / in col 7)
        if (indicator === "*" || indicator === "/") {
            result.push({
                text: original.length > SEQ_NUMBER_END + 1 ? original.substring(SEQ_NUMBER_END + 1) : "",
                originalLine: i,
                isComment: true,
                isBlank: false,
                indicator,
                originalText,
            });
            continue;
        }

        // Debug lines (D in col 7) - treat as comments for formatting
        if (indicator === "D" || indicator === "d") {
            result.push({
                text: original.length > SEQ_NUMBER_END + 1 ? original.substring(SEQ_NUMBER_END + 1) : "",
                originalLine: i,
                isComment: true,
                isBlank: false,
                indicator,
                originalText,
            });
            continue;
        }

        // Continuation line (- in col 7)
        if (indicator === "-") {
            // Continuation: append to previous non-blank, non-comment line
            const programText = original.length > SEQ_NUMBER_END + 1
                ? original.substring(SEQ_NUMBER_END + 1)
                : "";

            // Find the last non-comment, non-blank line to append to
            if (result.length > 0) {
                for (let j = result.length - 1; j >= 0; j--) {
                    if (!result[j].isComment && !result[j].isBlank) {
                        // Trim the leading spaces of the continuation and append
                        result[j].text = result[j].text.trimEnd() + " " + programText.trim();
                        break;
                    }
                }
            }
            // Don't add a new source line for continuations - they're merged
            continue;
        }

        // Normal program line: extract cols 8 onward (no upper limit — formatter
        // output may exceed col 72 for long logical lines joined from continuations)
        const programText = original.length > SEQ_NUMBER_END + 1
            ? original.substring(SEQ_NUMBER_END + 1)
            : "";

        result.push({
            text: programText,
            originalLine: i,
            isComment: false,
            isBlank: false,
            indicator: " ",
            originalText,
        });
    }

    return result;
}

function scanFreeForm(rawLines: string[]): SourceLine[] {
    const result: SourceLine[] = [];

    for (let i = 0; i < rawLines.length; i++) {
        const original = expandTabs(rawLines[i]);
        const originalText = rawLines[i];

        if (!original.trim()) {
            result.push({
                text: "",
                originalLine: i,
                isComment: false,
                isBlank: true,
                indicator: " ",
                originalText,
            });
            continue;
        }

        const trimmed = original.trim();

        // Free-form comment: line starting with *>
        if (trimmed.startsWith("*>")) {
            result.push({
                text: trimmed,
                originalLine: i,
                isComment: true,
                isBlank: false,
                indicator: "*",
                originalText,
            });
            continue;
        }

        result.push({
            text: trimmed,
            originalLine: i,
            isComment: false,
            isBlank: false,
            indicator: " ",
            originalText,
        });
    }

    return result;
}
