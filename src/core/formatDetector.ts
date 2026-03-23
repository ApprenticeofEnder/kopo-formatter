/**
 * Detects whether COBOL source is fixed-form or free-form.
 */

export type SourceFormat = "fixed" | "free";

/**
 * Detect source format from the source text.
 * Checks for compiler directives first, then uses heuristics.
 */
export function detectFormat(source: string, override?: "auto" | "fixed" | "free"): SourceFormat {
    if (override === "fixed") return "fixed";
    if (override === "free") return "free";

    const lines = source.split(/\r?\n/);

    // Check for >>SOURCE FORMAT directive (COBOL 2002+)
    for (const line of lines) {
        const trimmed = line.trim().toUpperCase();
        if (trimmed.startsWith(">>SOURCE")) {
            if (trimmed.includes("FREE")) return "free";
            if (trimmed.includes("FIXED")) return "fixed";
        }
        // Stop checking after first non-blank, non-directive, non-comment line
        if (trimmed && !trimmed.startsWith("*") && !trimmed.startsWith("/")) {
            break;
        }
    }

    // Heuristic: check first N non-blank lines
    let fixedScore = 0;
    let freeScore = 0;
    let checked = 0;

    for (const line of lines) {
        if (!line.trim()) continue;
        if (checked >= 20) break;
        checked++;

        // Fixed-form indicators:
        // - cols 1-6 are numeric (sequence numbers)
        // - col 7 is space, *, /, or -
        if (line.length >= 7) {
            const seqArea = line.substring(0, 6);
            const indicator = line.charAt(6);

            if (/^\d{6}$/.test(seqArea) || /^\s{6}$/.test(seqArea)) {
                if (" */-dD".includes(indicator)) {
                    fixedScore++;
                }
            }
        }

        // Free-form indicators:
        // - line starts with a COBOL keyword at column 1 (no sequence area)
        // - uses *> for inline comments
        const trimmed = line.trim().toUpperCase();
        if (/^\w/.test(line) && !line.startsWith("      ")) {
            const startsWithKeyword = [
                "IDENTIFICATION", "ID", "ENVIRONMENT", "DATA", "PROCEDURE",
                "PROGRAM-ID", "WORKING-STORAGE", "FILE-CONTROL",
            ].some(kw => trimmed.startsWith(kw));
            if (startsWithKeyword) {
                freeScore++;
            }
        }
        if (line.includes("*>")) {
            freeScore++;
        }
    }

    // Default to fixed-form if ambiguous
    return freeScore > fixedScore ? "free" : "fixed";
}
