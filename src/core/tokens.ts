/**
 * Token types produced by the scanner.
 */
export enum TokenKind {
    /** Any identifier or keyword: IDENTIFICATION, WS-VAR, MOVE, etc. */
    Word,
    /** Numeric literal: 05, 100, -3.14 */
    Number,
    /** Quoted string literal: "Hello" or 'Hello' */
    StringLiteral,
    /** The sentence/entry terminator "." */
    Period,
    /** "(" */
    LeftParen,
    /** ")" */
    RightParen,
    /** "," */
    Comma,
    /** "=" */
    Equals,
    /** Comparison operators: >, <, >= , <= */
    ComparisonOp,
    /** Arithmetic operators: +, -, *, / (when not indicator) */
    ArithmeticOp,
    /** End of file */
    EOF,
}

export interface Token {
    kind: TokenKind;
    text: string;
    /** 0-based source line number */
    line: number;
    /** 0-based column in the original source */
    column: number;
}

/** A logical source line after preprocessing (continuation joining, column stripping) */
export interface SourceLine {
    /** The program text content (cols 8-72 for fixed, full line for free) */
    text: string;
    /** Original 0-based line number in the source */
    originalLine: number;
    /** Whether this is a comment line */
    isComment: boolean;
    /** Whether this is a blank line */
    isBlank: boolean;
    /** The indicator character (col 7 in fixed-form: space, *, /, -, D) */
    indicator: string;
    /** Original full line text (for preserving comments exactly) */
    originalText: string;
}
