/**
 * Formatter configuration options.
 */
export interface FormatterOptions {
    /** Number of spaces per indentation level. When used via VS Code, editor.tabSize takes priority (default: 3) */
    indentationSpaces: number;
    /** Insert blank line after EXIT statements (default: true) */
    addEmptyLineAfterExit: boolean;
    /** Insert a blank line after each Division ends, before the next Division (default: false) */
    addEmptyLineAfterDivision: boolean;
    /** Insert a blank line after each Section ends, before the next Section (default: false) */
    addEmptyLineAfterSection: boolean;
    /** Do not print the continuation lines collected for multi-line statements
     *  (DISPLAY option lines, extra CALL arguments, etc.) (default: false) */
    omitContinuationLines: boolean;
    /** Indent WHEN clauses inside EVALUATE blocks (default: true) */
    evaluateIndentWhen: boolean;
    /** Align PIC/VALUE clauses in the Data Division (default: true) */
    alignPicClauses: boolean;
    /** Source format: auto-detect, fixed-form, or free-form (default: "auto") */
    sourceFormat: "auto" | "fixed" | "free";
    /** Normalize COBOL reserved word casing: "upper", "lower", or "preserve" (default: "preserve") */
    keywordCase: "upper" | "lower" | "preserve";
    /** Collapse runs of multiple spaces to a single space in statement text (default: false) */
    normalizeWhitespace: boolean;
    /** Wrap lines that exceed column 72 using fixed-form continuation markers (default: true) */
    wrapLongLines: boolean;
    /** Convert section and paragraph names to uppercase (default: false) */
    uppercaseProcedureNames: boolean;
    /** Align DELIMITED BY clauses in STRING/UNSTRING statements so data names and
     *  DELIMITED BY keywords each start at consistent columns (default: false) */
    alignDelimitedBy: boolean;
}

export const DEFAULT_OPTIONS: FormatterOptions = {
    indentationSpaces: 3,
    addEmptyLineAfterExit: true,
    addEmptyLineAfterDivision: false,
    addEmptyLineAfterSection: false,
    omitContinuationLines: false,
    evaluateIndentWhen: true,
    alignPicClauses: true,
    sourceFormat: "auto",
    keywordCase: "preserve",
    normalizeWhitespace: true,
    wrapLongLines: true,
    uppercaseProcedureNames: false,
    alignDelimitedBy: false,
};

export function resolveOptions(partial: Partial<FormatterOptions>): FormatterOptions {
    return { ...DEFAULT_OPTIONS, ...partial };
}
