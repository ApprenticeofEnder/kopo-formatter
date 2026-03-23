/**
 * Public API for the COBOL formatter core.
 * This module has zero dependency on VS Code.
 */

import { type FormatterOptions, resolveOptions } from "./options.js";
import { detectFormat } from "./formatDetector.js";
import { scan } from "./scanner.js";
import { parse } from "./parser.js";
import { print } from "./printer.js";

export { type FormatterOptions, DEFAULT_OPTIONS, resolveOptions } from "./options.js";
export { type SourceFormat } from "./formatDetector.js";
export { type SourceFile } from "./types.js";

/**
 * Format COBOL source code.
 *
 * @param source - Raw COBOL source text
 * @param options - Partial formatter options (unset values use defaults)
 * @returns Formatted COBOL source text
 */
export function format(source: string, options: Partial<FormatterOptions> = {}): string {
    const resolved = resolveOptions(options);
    const sourceFormat = detectFormat(source, resolved.sourceFormat);
    const lines = scan(source, sourceFormat);
    const ast = parse(lines, sourceFormat);
    const output = print(ast, resolved);
    return output;
}

/**
 * Parse COBOL source into an AST (for advanced use / inspection).
 */
export function parseSource(source: string, options: Partial<FormatterOptions> = {}) {
    const resolved = resolveOptions(options);
    const sourceFormat = detectFormat(source, resolved.sourceFormat);
    const lines = scan(source, sourceFormat);
    return parse(lines, sourceFormat);
}
