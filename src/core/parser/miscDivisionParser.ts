/**
 * Parsers for Identification and Environment divisions.
 * These divisions have relatively simple structure.
 */

import { type ParserState, consumeTrivia, isAtDivisionHeader, peekUpperText } from "../parser.js";
import {
    type DivisionChild,
    type Section,
    type DivisionEntry,
    type SelectEntry,
    type CopyStatement,
    type UnparsedLine,
} from "../types.js";

/**
 * Parse children of the Identification Division.
 * Contains entries like PROGRAM-ID, AUTHOR, DATE-WRITTEN, etc.
 */
export function parseIdentificationChildren(state: ParserState): DivisionChild[] {
    const children: DivisionChild[] = [];

    while (state.pos < state.lines.length && !isAtDivisionHeader(state)) {
        const trivia = consumeTrivia(state);
        if (state.pos >= state.lines.length || isAtDivisionHeader(state)) {
            // Put back consumed trivia so the next division captures it as its leadingTrivia
            state.pos -= trivia.length;
            break;
        }

        const line = state.lines[state.pos];
        const entry: DivisionEntry = {
            kind: "DivisionEntry",
            rawText: line.text.trim(),
            leadingTrivia: trivia,
        };
        children.push(entry);
        state.pos++;
    }

    return children;
}

/**
 * Parse children of the Environment Division.
 * Contains CONFIGURATION SECTION, INPUT-OUTPUT SECTION, FILE-CONTROL, etc.
 */
export function parseEnvironmentChildren(state: ParserState): DivisionChild[] {
    const children: DivisionChild[] = [];

    while (state.pos < state.lines.length && !isAtDivisionHeader(state)) {
        const trivia = consumeTrivia(state);
        if (state.pos >= state.lines.length || isAtDivisionHeader(state)) {
            // Put back consumed trivia so the next division captures it as its leadingTrivia
            state.pos -= trivia.length;
            break;
        }

        const upper = peekUpperText(state);

        // Check for section headers
        if (upper.endsWith("SECTION.") || upper.startsWith("CONFIGURATION SECTION") ||
            upper.startsWith("INPUT-OUTPUT SECTION")) {
            const section = parseEnvironmentSection(state, trivia);
            children.push(section);
        } else if (upper.startsWith("FILE-CONTROL")) {
            const section = parseEnvironmentSection(state, trivia);
            children.push(section);
        } else if (upper.startsWith("SPECIAL-NAMES")) {
            const section = parseEnvironmentSection(state, trivia);
            children.push(section);
        } else if (upper.startsWith("SELECT")) {
            const line = state.lines[state.pos];
            // Collect continuation lines for SELECT
            let rawText = line.text.trim();
            state.pos++;
            while (state.pos < state.lines.length) {
                const nextLine = state.lines[state.pos];
                if (nextLine.isBlank || nextLine.isComment) break;
                const nextUpper = nextLine.text.trim().toUpperCase();
                if (isAtDivisionHeader(state) || isSectionOrSelectStart(nextUpper)) break;
                rawText += " " + nextLine.text.trim();
                state.pos++;
                if (rawText.endsWith(".")) break;
            }
            const select: SelectEntry = {
                kind: "SelectEntry",
                rawText,
                leadingTrivia: trivia,
            };
            children.push(select);
        } else {
            const line = state.lines[state.pos];
            const entry: DivisionEntry = {
                kind: "DivisionEntry",
                rawText: line.text.trim(),
                leadingTrivia: trivia,
            };
            children.push(entry);
            state.pos++;
        }
    }

    return children;
}

function parseEnvironmentSection(state: ParserState, leadingTrivia: import("../types.js").Trivia[]): Section {
    const headerLine = state.lines[state.pos];
    const section: Section = {
        kind: "Section",
        name: extractSectionName(headerLine.text.trim()),
        headerText: headerLine.text.trim(),
        leadingTrivia,
        children: [],
    };
    state.pos++;

    // Parse section contents until next section, division, or end
    while (state.pos < state.lines.length && !isAtDivisionHeader(state)) {
        const trivia = consumeTrivia(state);
        if (state.pos >= state.lines.length || isAtDivisionHeader(state)) break;

        const upper = peekUpperText(state);
        // Stop at next section
        if (isSectionStart(upper) || upper.startsWith("FILE-CONTROL") || upper.startsWith("SPECIAL-NAMES")) {
            // Put back trivia by not consuming
            state.pos -= countTriviaLines(trivia);
            break;
        }

        if (upper.startsWith("SELECT")) {
            const line = state.lines[state.pos];
            let rawText = line.text.trim();
            state.pos++;
            while (state.pos < state.lines.length) {
                const nextLine = state.lines[state.pos];
                if (nextLine.isBlank || nextLine.isComment) break;
                const nextUpper = nextLine.text.trim().toUpperCase();
                if (isAtDivisionHeader(state) || isSectionOrSelectStart(nextUpper)) break;
                rawText += " " + nextLine.text.trim();
                state.pos++;
                if (rawText.endsWith(".")) break;
            }
            section.children.push({
                kind: "SelectEntry",
                rawText,
                leadingTrivia: trivia,
            });
        } else if (upper.startsWith("COPY ")) {
            const line = state.lines[state.pos];
            section.children.push({
                kind: "CopyStatement",
                rawText: line.text.trim(),
                leadingTrivia: trivia,
            } as CopyStatement);
            state.pos++;
        } else {
            const line = state.lines[state.pos];
            section.children.push({
                kind: "DivisionEntry",
                rawText: line.text.trim(),
                leadingTrivia: trivia,
            } as DivisionEntry);
            state.pos++;
        }
    }

    return section;
}

function extractSectionName(text: string): string {
    const upper = text.toUpperCase();
    if (upper.startsWith("CONFIGURATION")) return "CONFIGURATION";
    if (upper.startsWith("INPUT-OUTPUT")) return "INPUT-OUTPUT";
    if (upper.startsWith("FILE-CONTROL")) return "FILE-CONTROL";
    if (upper.startsWith("SPECIAL-NAMES")) return "SPECIAL-NAMES";
    return text.split(/\s+/)[0];
}

function isSectionStart(upper: string): boolean {
    return upper.endsWith("SECTION.") ||
        upper.startsWith("CONFIGURATION SECTION") ||
        upper.startsWith("INPUT-OUTPUT SECTION");
}

function isSectionOrSelectStart(upper: string): boolean {
    return isSectionStart(upper) ||
        upper.startsWith("SELECT") ||
        upper.startsWith("FILE-CONTROL") ||
        upper.startsWith("SPECIAL-NAMES");
}

function countTriviaLines(trivia: import("../types.js").Trivia[]): number {
    return trivia.length;
}
