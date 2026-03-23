/**
 * Main printer: walks the AST and produces formatted COBOL text.
 */

import { type FormatterOptions } from "./options.js";
import { type SourceFormat } from "./formatDetector.js";
import {
    type SourceFile,
    type Division,
    type DivisionChild,
    type Section,
    type DataEntry,
    type UnparsedLine,
    type Trivia,
} from "./types.js";
import { buildLine } from "./layout.js";
import { applyCase } from "./caseNormalizer.js";
import {
    type AlignmentMap,
    computeAlignment,
    printDataEntry,
    printDataSection,
    printFdEntry,
    printCopyStatement,
    printTrivia,
} from "./printer/dataPrinter.js";
import {
    printProcedureSection,
    printParagraph,
    printStatement,
} from "./printer/procedurePrinter.js";

/**
 * Print a SourceFile AST to formatted COBOL text.
 */
export function print(ast: SourceFile, options: FormatterOptions): string {
    const lines: string[] = [];
    const format = ast.format;

    for (const node of ast.children) {
        if (node.kind === "Division") {
            lines.push(...printDivision(node, options, format));
        } else if (node.kind === "UnparsedLine") {
            lines.push(...printTrivia(node.leadingTrivia, format));
            lines.push(buildLine(format, { areaA: true, content: node.rawText }));
        }
    }

    // Trailing trivia
    lines.push(...printTrivia(ast.trailingTrivia, format));

    return lines.join("\n");
}

function printDivision(
    division: Division,
    options: FormatterOptions,
    format: SourceFormat,
): string[] {
    const lines: string[] = [];

    lines.push(...printTrivia(division.leadingTrivia, format));
    lines.push(buildLine(format, { areaA: true, content: applyCase(division.headerText, options) }));

    switch (division.divisionType) {
        case "DataDivision":
            lines.push(...printDataDivisionChildren(division.children, options, format));
            break;
        case "ProcedureDivision":
            lines.push(...printProcedureDivisionChildren(division.children, options, format));
            break;
        default:
            lines.push(...printGenericDivisionChildren(division.children, options, format));
            break;
    }

    return lines;
}

function printDataDivisionChildren(
    children: DivisionChild[],
    options: FormatterOptions,
    format: SourceFormat,
): string[] {
    // Pre-pass: compute alignment across all data entries
    const allDataEntries = collectAllDataEntries(children);
    const alignment = options.alignPicClauses
        ? computeAlignment(allDataEntries, options, 0)
        : { picAlignment: new Map<number, number>() };

    const lines: string[] = [];

    for (const child of children) {
        switch (child.kind) {
            case "Section":
                lines.push(...printDataSection(child, options, format, alignment));
                break;
            case "DataEntry":
                lines.push(...printDataEntry(child, 0, options, format, alignment, ""));
                break;
            case "FdEntry":
                lines.push(...printFdEntry(child, options, format, alignment));
                break;
            case "CopyStatement":
                lines.push(...printCopyStatement(child, 0, options, format));
                break;
            case "UnparsedLine":
                lines.push(...printTrivia(child.leadingTrivia, format));
                lines.push(buildLine(format, { areaA: true, content: child.rawText }));
                break;
            default:
                lines.push(...printGenericChild(child, format, options));
                break;
        }
    }

    return lines;
}

function printProcedureDivisionChildren(
    children: DivisionChild[],
    options: FormatterOptions,
    format: SourceFormat,
): string[] {
    const lines: string[] = [];

    for (const child of children) {
        switch (child.kind) {
            case "ProcedureSection":
                lines.push(...printProcedureSection(child, options, format));
                break;
            case "Paragraph":
                lines.push(...printParagraph(child, options, format));
                break;
            case "UnparsedLine":
                lines.push(...printTrivia(child.leadingTrivia, format));
                lines.push(buildLine(format, { areaA: false, content: child.rawText }));
                break;
            default:
                lines.push(...printGenericChild(child, format, options));
                break;
        }
    }

    return lines;
}

function printGenericDivisionChildren(
    children: DivisionChild[],
    options: FormatterOptions,
    format: SourceFormat,
): string[] {
    const lines: string[] = [];

    for (const child of children) {
        switch (child.kind) {
            case "Section":
                lines.push(...printTrivia(child.leadingTrivia, format));
                lines.push(buildLine(format, { areaA: true, content: applyCase(child.headerText, options) }));
                for (const subChild of child.children) {
                    lines.push(...printGenericChild(subChild, format, options));
                }
                break;
            case "SelectEntry":
                lines.push(...printTrivia(child.leadingTrivia, format));
                lines.push(buildLine(format, { areaA: true, content: applyCase(child.rawText, options) }));
                break;
            default:
                lines.push(...printGenericChild(child, format, options));
                break;
        }
    }

    return lines;
}

function printGenericChild(child: DivisionChild, format: SourceFormat, options?: FormatterOptions): string[] {
    const lines: string[] = [];
    if ("leadingTrivia" in child && Array.isArray(child.leadingTrivia)) {
        lines.push(...printTrivia(child.leadingTrivia as Trivia[], format));
    }
    if ("rawText" in child && typeof child.rawText === "string") {
        const text = options ? applyCase(child.rawText, options) : child.rawText;
        lines.push(buildLine(format, { areaA: true, content: text }));
    } else if ("headerText" in child && typeof child.headerText === "string") {
        const text = options ? applyCase(child.headerText, options) : child.headerText;
        lines.push(buildLine(format, { areaA: true, content: text }));
    }
    return lines;
}

/**
 * Collect all DataEntry nodes from division children (for alignment pre-pass).
 */
function collectAllDataEntries(children: DivisionChild[]): DataEntry[] {
    const entries: DataEntry[] = [];

    for (const child of children) {
        if (child.kind === "DataEntry") {
            entries.push(child);
        } else if (child.kind === "Section") {
            for (const subChild of child.children) {
                if (subChild.kind === "DataEntry") {
                    entries.push(subChild);
                } else if (subChild.kind === "FdEntry") {
                    entries.push(...subChild.records);
                }
            }
        } else if (child.kind === "FdEntry") {
            entries.push(...child.records);
        }
    }

    return entries;
}
