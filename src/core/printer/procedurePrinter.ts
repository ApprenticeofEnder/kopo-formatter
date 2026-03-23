/**
 * Printer for Procedure Division: handles block indentation and statement formatting.
 */

import { type FormatterOptions } from "../options.js";
import { type SourceFormat } from "../formatDetector.js";
import {
    type Paragraph,
    type ProcedureSection,
    type ProcedureStatement,
    type IfStatement,
    type EvaluateStatement,
    type PerformBlock,
    type ReadBlock,
    type SimpleStatement,
    type UnparsedLine,
    type Trivia,
} from "../types.js";
import { buildLine } from "../layout.js";
import { printTrivia } from "./dataPrinter.js";

/**
 * Print a procedure section.
 */
export function printProcedureSection(
    section: ProcedureSection,
    options: FormatterOptions,
    format: SourceFormat,
): string[] {
    const lines: string[] = [];
    lines.push(...printTrivia(section.leadingTrivia, format));
    // Section header goes in Area A
    lines.push(buildLine(format, { areaA: true, content: section.headerText }));

    for (const para of section.paragraphs) {
        lines.push(...printParagraph(para, options, format));
    }

    return lines;
}

/**
 * Print a paragraph.
 */
export function printParagraph(
    para: Paragraph,
    options: FormatterOptions,
    format: SourceFormat,
): string[] {
    const lines: string[] = [];
    lines.push(...printTrivia(para.leadingTrivia, format));

    // Paragraph name in Area A (if it has a name)
    if (para.name) {
        lines.push(buildLine(format, { areaA: true, content: para.name + "." }));
    }

    // Print statements at base indent level (0)
    for (const stmt of para.statements) {
        lines.push(...printStatement(stmt, 0, options, format));
    }

    return lines;
}

/**
 * Print a statement at the given indent depth.
 */
export function printStatement(
    stmt: ProcedureStatement,
    depth: number,
    options: FormatterOptions,
    format: SourceFormat,
): string[] {
    switch (stmt.kind) {
        case "SimpleStatement":
            return printSimpleStatement(stmt, depth, options, format);
        case "IfStatement":
            return printIfStatement(stmt, depth, options, format);
        case "EvaluateStatement":
            return printEvaluateStatement(stmt, depth, options, format);
        case "PerformBlock":
            return printPerformBlock(stmt, depth, options, format);
        case "ReadBlock":
            return printReadBlock(stmt, depth, options, format);
        case "UnparsedLine":
            return printUnparsedStatement(stmt, depth, options, format);
        default:
            return [];
    }
}

function printSimpleStatement(
    stmt: SimpleStatement,
    depth: number,
    options: FormatterOptions,
    format: SourceFormat,
): string[] {
    const lines: string[] = [];
    lines.push(...printTrivia(stmt.leadingTrivia, format));
    const indent = depth * options.indentationSpaces;
    lines.push(buildLine(format, { areaA: false, indent, content: stmt.rawText }));

    // Add empty line after EXIT if option enabled
    if (options.addEmptyLineAfterExit && stmt.verb === "EXIT" && stmt.rawText.trim().toUpperCase().endsWith("EXIT.")) {
        lines.push("");
    }

    return lines;
}

function printIfStatement(
    stmt: IfStatement,
    depth: number,
    options: FormatterOptions,
    format: SourceFormat,
): string[] {
    const lines: string[] = [];
    const indent = depth * options.indentationSpaces;

    lines.push(...printTrivia(stmt.leadingTrivia, format));
    lines.push(buildLine(format, { areaA: false, indent, content: stmt.conditionText }));

    // Then body at depth + 1
    for (const child of stmt.thenBody) {
        lines.push(...printStatement(child, depth + 1, options, format));
    }

    // Else clause
    if (stmt.elseBody.length > 0) {
        lines.push(buildLine(format, { areaA: false, indent, content: "ELSE" }));
        for (const child of stmt.elseBody) {
            lines.push(...printStatement(child, depth + 1, options, format));
        }
    }

    // END-IF
    lines.push(buildLine(format, { areaA: false, indent, content: "END-IF" }));

    return lines;
}

function printEvaluateStatement(
    stmt: EvaluateStatement,
    depth: number,
    options: FormatterOptions,
    format: SourceFormat,
): string[] {
    const lines: string[] = [];
    const indent = depth * options.indentationSpaces;

    lines.push(...printTrivia(stmt.leadingTrivia, format));
    lines.push(buildLine(format, { areaA: false, indent, content: stmt.subjectText }));

    for (const branch of stmt.whenBranches) {
        lines.push(...printTrivia(branch.leadingTrivia, format));

        // WHEN clause indent depends on evaluateIndentWhen option
        const whenDepth = options.evaluateIndentWhen ? depth + 1 : depth;
        const whenIndent = whenDepth * options.indentationSpaces;
        lines.push(buildLine(format, { areaA: false, indent: whenIndent, content: branch.conditionText }));

        // WHEN body at whenDepth + 1
        for (const child of branch.body) {
            lines.push(...printStatement(child, whenDepth + 1, options, format));
        }
    }

    // END-EVALUATE
    lines.push(buildLine(format, { areaA: false, indent, content: "END-EVALUATE" }));

    return lines;
}

function printPerformBlock(
    stmt: PerformBlock,
    depth: number,
    options: FormatterOptions,
    format: SourceFormat,
): string[] {
    const lines: string[] = [];
    const indent = depth * options.indentationSpaces;

    lines.push(...printTrivia(stmt.leadingTrivia, format));
    lines.push(buildLine(format, { areaA: false, indent, content: stmt.clauseText }));

    // Body at depth + 1
    for (const child of stmt.body) {
        lines.push(...printStatement(child, depth + 1, options, format));
    }

    // END-PERFORM
    lines.push(buildLine(format, { areaA: false, indent, content: "END-PERFORM" }));

    return lines;
}

function printReadBlock(
    stmt: ReadBlock,
    depth: number,
    options: FormatterOptions,
    format: SourceFormat,
): string[] {
    const lines: string[] = [];
    const indent = depth * options.indentationSpaces;

    lines.push(...printTrivia(stmt.leadingTrivia, format));
    lines.push(buildLine(format, { areaA: false, indent, content: stmt.headerText }));

    if (stmt.atEndBody.length > 0) {
        lines.push(buildLine(format, { areaA: false, indent: (depth + 1) * options.indentationSpaces, content: "AT END" }));
        for (const child of stmt.atEndBody) {
            lines.push(...printStatement(child, depth + 2, options, format));
        }
    }

    if (stmt.notAtEndBody.length > 0) {
        lines.push(buildLine(format, { areaA: false, indent, content: "NOT AT END" }));
        for (const child of stmt.notAtEndBody) {
            lines.push(...printStatement(child, depth + 1, options, format));
        }
    }

    if (stmt.invalidKeyBody.length > 0) {
        lines.push(buildLine(format, { areaA: false, indent: (depth + 1) * options.indentationSpaces, content: "INVALID KEY" }));
        for (const child of stmt.invalidKeyBody) {
            lines.push(...printStatement(child, depth + 2, options, format));
        }
    }

    if (stmt.notInvalidKeyBody.length > 0) {
        lines.push(buildLine(format, { areaA: false, indent, content: "NOT INVALID KEY" }));
        for (const child of stmt.notInvalidKeyBody) {
            lines.push(...printStatement(child, depth + 1, options, format));
        }
    }

    // END-READ
    lines.push(buildLine(format, { areaA: false, indent, content: "END-READ" }));

    return lines;
}

function printUnparsedStatement(
    stmt: UnparsedLine,
    depth: number,
    options: FormatterOptions,
    format: SourceFormat,
): string[] {
    const lines: string[] = [];
    lines.push(...printTrivia(stmt.leadingTrivia, format));
    const indent = depth * options.indentationSpaces;
    lines.push(buildLine(format, { areaA: false, indent, content: stmt.rawText }));
    return lines;
}
