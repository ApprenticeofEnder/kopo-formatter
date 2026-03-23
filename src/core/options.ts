/**
 * Formatter configuration options.
 */
export interface FormatterOptions {
    /** Number of spaces per indentation level (default: 3) */
    indentationSpaces: number;
    /** Insert blank line after EXIT statements (default: true) */
    addEmptyLineAfterExit: boolean;
    /** Indent WHEN clauses inside EVALUATE blocks (default: true) */
    evaluateIndentWhen: boolean;
    /** Align PIC/VALUE clauses in the Data Division (default: true) */
    alignPicClauses: boolean;
    /** Source format: auto-detect, fixed-form, or free-form (default: "auto") */
    sourceFormat: "auto" | "fixed" | "free";
}

export const DEFAULT_OPTIONS: FormatterOptions = {
    indentationSpaces: 3,
    addEmptyLineAfterExit: true,
    evaluateIndentWhen: true,
    alignPicClauses: true,
    sourceFormat: "auto",
};

export function resolveOptions(partial: Partial<FormatterOptions>): FormatterOptions {
    return { ...DEFAULT_OPTIONS, ...partial };
}
