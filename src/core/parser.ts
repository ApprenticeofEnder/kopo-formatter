/**
 * Recursive descent parser: SourceLine[] → AST (SourceFile).
 *
 * The parser is tolerant — unrecognized constructs become UnparsedLine nodes.
 */

import { type SourceLine } from "./tokens.js";
import { type SourceFormat } from "./formatDetector.js";
import {
    type SourceFile,
    type Division,
    type DivisionKind,
    type TopLevelNode,
    type Trivia,
    type UnparsedLine,
} from "./types.js";
import { DIVISION_KEYWORDS } from "./constants.js";
import { parseDataDivisionChildren } from "./parser/dataDivisionParser.js";
import { parseProcedureDivisionChildren } from "./parser/procedureDivisionParser.js";
import { parseIdentificationChildren, parseEnvironmentChildren } from "./parser/miscDivisionParser.js";

export interface ParserState {
    lines: SourceLine[];
    pos: number;
    format: SourceFormat;
}

export function parse(lines: SourceLine[], format: SourceFormat): SourceFile {
    const state: ParserState = { lines, pos: 0, format };
    const children: TopLevelNode[] = [];
    const trailingTrivia: Trivia[] = [];

    while (state.pos < state.lines.length) {
        const triviaBeforeDiv = consumeTrivia(state);
        if (state.pos >= state.lines.length) {
            trailingTrivia.push(...triviaBeforeDiv);
            break;
        }

        const divisionMatch = matchDivisionHeader(state);
        if (divisionMatch) {
            const division = parseDivision(state, divisionMatch.kind, divisionMatch.headerText, triviaBeforeDiv);
            children.push(division);
        } else {
            // Not a division header — emit as unparsed
            const line = state.lines[state.pos];
            const unparsed: UnparsedLine = {
                kind: "UnparsedLine",
                rawText: line.text.trim(),
                originalLine: line.originalLine,
                leadingTrivia: triviaBeforeDiv,
            };
            children.push(unparsed);
            state.pos++;
        }
    }

    return {
        kind: "SourceFile",
        format,
        children,
        trailingTrivia,
    };
}

function matchDivisionHeader(state: ParserState): { kind: DivisionKind; headerText: string } | null {
    const line = state.lines[state.pos];
    if (line.isComment || line.isBlank) return null;

    const upper = line.text.trim().toUpperCase();

    for (const keyword of DIVISION_KEYWORDS) {
        if (upper.startsWith(keyword)) {
            let kind: DivisionKind;
            if (keyword.includes("IDENTIFICATION") || keyword.includes("ID")) {
                kind = "IdentificationDivision";
            } else if (keyword.includes("ENVIRONMENT")) {
                kind = "EnvironmentDivision";
            } else if (keyword.startsWith("DATA")) {
                kind = "DataDivision";
            } else {
                kind = "ProcedureDivision";
            }
            return { kind, headerText: line.text.trim() };
        }
    }

    return null;
}

function parseDivision(
    state: ParserState,
    kind: DivisionKind,
    headerText: string,
    leadingTrivia: Trivia[],
): Division {
    // Consume the header line
    state.pos++;

    const division: Division = {
        kind: "Division",
        divisionType: kind,
        headerText,
        leadingTrivia,
        children: [],
    };

    // Parse children based on division type, stopping at next division
    switch (kind) {
        case "IdentificationDivision":
            division.children = parseIdentificationChildren(state);
            break;
        case "EnvironmentDivision":
            division.children = parseEnvironmentChildren(state);
            break;
        case "DataDivision":
            division.children = parseDataDivisionChildren(state);
            break;
        case "ProcedureDivision":
            division.children = parseProcedureDivisionChildren(state);
            break;
    }

    return division;
}

// ─── Shared helpers ─────────────────────────────────────────────────────

export function consumeTrivia(state: ParserState): Trivia[] {
    const trivia: Trivia[] = [];
    while (state.pos < state.lines.length) {
        const line = state.lines[state.pos];
        if (line.isBlank) {
            trivia.push({
                kind: "BlankLine",
                text: "",
                originalLine: line.originalLine,
            });
            state.pos++;
        } else if (line.isComment) {
            trivia.push({
                kind: "Comment",
                text: line.text,
                indicator: line.indicator,
                originalLine: line.originalLine,
            });
            state.pos++;
        } else {
            break;
        }
    }
    return trivia;
}

export function isAtDivisionHeader(state: ParserState): boolean {
    if (state.pos >= state.lines.length) return false;
    return matchDivisionHeader(state) !== null;
}

export function peekUpperText(state: ParserState): string {
    if (state.pos >= state.lines.length) return "";
    const line = state.lines[state.pos];
    if (line.isComment || line.isBlank) return "";
    return line.text.trim().toUpperCase();
}
