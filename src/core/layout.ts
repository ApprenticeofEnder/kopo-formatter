/**
 * Line construction helpers for fixed-form and free-form COBOL output.
 */

import { SEQ_NUMBER_END, AREA_A_START, AREA_A_END } from "./constants.js";
import { type SourceFormat } from "./formatDetector.js";

/**
 * Build a fixed-form COBOL line.
 * cols 1-6: sequence area (spaces)
 * col 7: indicator
 * cols 8-11: Area A
 * cols 12+: Area B
 */
export function buildFixedFormLine(
    indicator: string,
    content: string,
): string {
    const seqArea = " ".repeat(SEQ_NUMBER_END);
    return (seqArea + indicator + content).trimEnd();
}

/**
 * Build a fixed-form line with Area A content (starts at col 8).
 */
export function buildAreaALine(content: string): string {
    return buildFixedFormLine(" ", content);
}

/**
 * Build a fixed-form line with Area B content (starts at col 12).
 */
export function buildAreaBLine(content: string, indentSpaces: number = 0): string {
    const areaAPadding = " ".repeat(AREA_A_END - AREA_A_START + 1);
    return buildFixedFormLine(" ", areaAPadding + " ".repeat(indentSpaces) + content);
}

/**
 * Build a fixed-form comment line.
 */
export function buildCommentLine(indicator: string, text: string): string {
    return buildFixedFormLine(indicator, text);
}

/**
 * Build a free-form line with the given indentation.
 */
export function buildFreeFormLine(indent: number, content: string): string {
    return (" ".repeat(indent) + content).trimEnd();
}

/**
 * Build a line in the appropriate format.
 */
export function buildLine(
    format: SourceFormat,
    options: {
        areaA?: boolean;
        indent?: number;
        content: string;
        indicator?: string;
    },
): string {
    if (format === "free") {
        const baseIndent = options.areaA ? 0 : 4;
        return buildFreeFormLine(baseIndent + (options.indent ?? 0), options.content);
    }

    if (options.indicator && options.indicator !== " ") {
        return buildCommentLine(options.indicator, options.content);
    }

    if (options.areaA) {
        return buildAreaALine(" ".repeat(options.indent ?? 0) + options.content);
    }

    return buildAreaBLine(options.content, options.indent ?? 0);
}
