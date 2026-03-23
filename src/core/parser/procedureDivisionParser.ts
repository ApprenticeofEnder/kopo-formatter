/**
 * Parser for Procedure Division: paragraphs, sections, and block statements.
 */

import { type ParserState, consumeTrivia, isAtDivisionHeader, peekUpperText } from "../parser.js";
import {
    type DivisionChild,
    type Paragraph,
    type ProcedureSection,
    type ProcedureStatement,
    type SimpleStatement,
    type IfStatement,
    type EvaluateStatement,
    type WhenBranch,
    type PerformBlock,
    type ReadBlock,
    type UnparsedLine,
    type Trivia,
} from "../types.js";
import {
    AREA_A_KEYWORDS,
    AREA_B_STATEMENTS,
    INDENT_START_KEYWORDS,
    INDENT_END_KEYWORDS,
} from "../constants.js";

/**
 * Parse children of the Procedure Division.
 */
export function parseProcedureDivisionChildren(state: ParserState): DivisionChild[] {
    const children: DivisionChild[] = [];

    while (state.pos < state.lines.length && !isAtDivisionHeader(state)) {
        const trivia = consumeTrivia(state);
        if (state.pos >= state.lines.length || isAtDivisionHeader(state)) break;

        const upper = peekUpperText(state);

        // Check for SECTION header (e.g., "MAIN-SECTION SECTION.")
        if (/^\S+\s+SECTION\.?$/.test(upper)) {
            const section = parseProcSection(state, trivia);
            children.push(section);
        } else if (isParagraphName(state, upper)) {
            const para = parseParagraph(state, trivia);
            children.push(para);
        } else if (upper.startsWith("DECLARATIVES")) {
            // Handle DECLARATIVES as an unparsed line for now
            const line = state.lines[state.pos];
            children.push({
                kind: "UnparsedLine",
                rawText: line.text.trim(),
                originalLine: line.originalLine,
                leadingTrivia: trivia,
            });
            state.pos++;
        } else {
            // Statement or unrecognized line at division level
            const stmts = parseStatementSequence(state, trivia, []);
            for (const stmt of stmts) {
                children.push(stmt as DivisionChild);
            }
        }
    }

    return children;
}

function parseProcSection(state: ParserState, leadingTrivia: Trivia[]): ProcedureSection {
    const headerLine = state.lines[state.pos];
    const name = headerLine.text.trim().split(/\s+/)[0];

    const section: ProcedureSection = {
        kind: "ProcedureSection",
        name,
        headerText: headerLine.text.trim(),
        leadingTrivia,
        paragraphs: [],
    };
    state.pos++;

    while (state.pos < state.lines.length && !isAtDivisionHeader(state)) {
        const trivia = consumeTrivia(state);
        if (state.pos >= state.lines.length || isAtDivisionHeader(state)) break;

        const upper = peekUpperText(state);

        // Stop at next SECTION
        if (/^\S+\s+SECTION\.?$/.test(upper)) {
            state.pos -= trivia.length;
            break;
        }

        if (isParagraphName(state, upper)) {
            const para = parseParagraph(state, trivia);
            section.paragraphs.push(para);
        } else {
            // Statements before first paragraph — wrap in anonymous paragraph
            const stmts = parseStatementSequence(state, trivia, []);
            if (stmts.length > 0) {
                section.paragraphs.push({
                    kind: "Paragraph",
                    name: "",
                    leadingTrivia: [],
                    statements: stmts,
                });
            }
        }
    }

    return section;
}

function parseParagraph(state: ParserState, leadingTrivia: Trivia[]): Paragraph {
    const headerLine = state.lines[state.pos];
    const name = headerLine.text.trim().replace(/\.\s*$/, "");

    const para: Paragraph = {
        kind: "Paragraph",
        name,
        leadingTrivia,
        statements: [],
    };
    state.pos++;

    // Parse statements until next paragraph, section, or division
    while (state.pos < state.lines.length && !isAtDivisionHeader(state)) {
        const trivia = consumeTrivia(state);
        if (state.pos >= state.lines.length || isAtDivisionHeader(state)) break;

        const upper = peekUpperText(state);

        // Stop at next paragraph or section
        if (isParagraphName(state, upper) || /^\S+\s+SECTION\.?$/.test(upper)) {
            state.pos -= trivia.length;
            break;
        }

        const stmts = parseStatementSequence(state, trivia, []);
        para.statements.push(...stmts);
    }

    return para;
}

/**
 * Parse a sequence of statements, respecting block structure.
 * terminators: keywords that signal the end of the current block.
 */
function parseStatementSequence(
    state: ParserState,
    initialTrivia: Trivia[],
    terminators: string[],
): ProcedureStatement[] {
    const statements: ProcedureStatement[] = [];
    let currentTrivia = initialTrivia;

    while (state.pos < state.lines.length && !isAtDivisionHeader(state)) {
        const line = state.lines[state.pos];
        if (line.isBlank || line.isComment) {
            currentTrivia = [...currentTrivia, ...consumeTrivia(state)];
            continue;
        }

        const upper = peekUpperText(state);

        // Check terminators
        if (terminators.length > 0 && matchesTerminator(upper, terminators)) {
            break;
        }

        // Check for paragraph/section boundary
        if (isParagraphName(state, upper) || /^\S+\s+SECTION\.?$/.test(upper)) {
            break;
        }

        const rawText = line.text.trim();
        const verb = extractVerb(upper);
        state.pos++;

        // Handle block statements
        if (verb === "IF") {
            const stmt = parseIfStatement(state, rawText, currentTrivia);
            statements.push(stmt);
            currentTrivia = [];
        } else if (verb === "EVALUATE") {
            const stmt = parseEvaluateStatement(state, rawText, currentTrivia);
            statements.push(stmt);
            currentTrivia = [];
        } else if (verb === "PERFORM" && isBlockPerform(upper, rawText)) {
            const stmt = parsePerformBlock(state, rawText, currentTrivia);
            statements.push(stmt);
            currentTrivia = [];
        } else if (verb === "READ") {
            const stmt = parseReadBlock(state, rawText, currentTrivia);
            statements.push(stmt);
            currentTrivia = [];
        } else {
            // Simple statement
            const stmt: SimpleStatement = {
                kind: "SimpleStatement",
                verb,
                rawText,
                leadingTrivia: currentTrivia,
            };
            statements.push(stmt);
            currentTrivia = [];
        }
    }

    return statements;
}

function parseIfStatement(state: ParserState, headerText: string, leadingTrivia: Trivia[]): IfStatement {
    const conditionText = headerText;
    const thenBody: ProcedureStatement[] = [];
    let elseBody: ProcedureStatement[] = [];

    // Parse THEN body until ELSE, END-IF, or period-terminated line
    const thenTerminators = ["END-IF", "ELSE"];
    const thenTrivia = consumeTrivia(state);
    const thenStatements = parseStatementSequence(state, thenTrivia, thenTerminators);
    thenBody.push(...thenStatements);

    // Check if we hit ELSE
    const upper = peekUpperText(state);
    if (upper.startsWith("ELSE")) {
        state.pos++; // consume ELSE
        const elseTrivia = consumeTrivia(state);
        const elseStatements = parseStatementSequence(state, elseTrivia, ["END-IF"]);
        elseBody = elseStatements;
    }

    // Consume END-IF if present
    const endUpper = peekUpperText(state);
    if (endUpper.startsWith("END-IF")) {
        state.pos++;
    }

    return {
        kind: "IfStatement",
        conditionText,
        thenBody,
        elseBody,
        leadingTrivia,
    };
}

function parseEvaluateStatement(state: ParserState, headerText: string, leadingTrivia: Trivia[]): EvaluateStatement {
    const subjectText = headerText;
    const whenBranches: WhenBranch[] = [];

    while (state.pos < state.lines.length && !isAtDivisionHeader(state)) {
        const trivia = consumeTrivia(state);
        const upper = peekUpperText(state);

        if (upper.startsWith("END-EVALUATE")) {
            state.pos++;
            break;
        }

        if (upper.startsWith("WHEN")) {
            const whenLine = state.lines[state.pos];
            const conditionText = whenLine.text.trim();
            state.pos++;

            const bodyTrivia = consumeTrivia(state);
            const body = parseStatementSequence(state, bodyTrivia, ["WHEN", "WHEN OTHER", "END-EVALUATE"]);

            whenBranches.push({
                kind: "WhenBranch",
                conditionText,
                body,
                leadingTrivia: trivia,
            });
        } else if (!upper) {
            break;
        } else {
            // Unexpected — just skip
            state.pos++;
        }
    }

    return {
        kind: "EvaluateStatement",
        subjectText,
        whenBranches,
        leadingTrivia,
    };
}

function parsePerformBlock(state: ParserState, headerText: string, leadingTrivia: Trivia[]): PerformBlock {
    const bodyTrivia = consumeTrivia(state);
    const body = parseStatementSequence(state, bodyTrivia, ["END-PERFORM"]);

    const endUpper = peekUpperText(state);
    if (endUpper.startsWith("END-PERFORM")) {
        state.pos++;
    }

    return {
        kind: "PerformBlock",
        clauseText: headerText,
        body,
        leadingTrivia,
    };
}

function parseReadBlock(state: ParserState, headerText: string, leadingTrivia: Trivia[]): ReadBlock {
    const readBlock: ReadBlock = {
        kind: "ReadBlock",
        headerText,
        atEndBody: [],
        notAtEndBody: [],
        invalidKeyBody: [],
        notInvalidKeyBody: [],
        leadingTrivia,
    };

    while (state.pos < state.lines.length && !isAtDivisionHeader(state)) {
        const trivia = consumeTrivia(state);
        const upper = peekUpperText(state);

        if (upper.startsWith("END-READ")) {
            state.pos++;
            break;
        }

        if (upper.startsWith("NOT AT END")) {
            state.pos++;
            const bodyTrivia = consumeTrivia(state);
            readBlock.notAtEndBody = parseStatementSequence(state, bodyTrivia, ["END-READ", "NOT AT END", "AT END", "INVALID KEY", "NOT INVALID KEY"]);
        } else if (upper.startsWith("AT END")) {
            state.pos++;
            const bodyTrivia = consumeTrivia(state);
            readBlock.atEndBody = parseStatementSequence(state, bodyTrivia, ["END-READ", "NOT AT END", "INVALID KEY", "NOT INVALID KEY"]);
        } else if (upper.startsWith("NOT INVALID KEY")) {
            state.pos++;
            const bodyTrivia = consumeTrivia(state);
            readBlock.notInvalidKeyBody = parseStatementSequence(state, bodyTrivia, ["END-READ"]);
        } else if (upper.startsWith("INVALID KEY")) {
            state.pos++;
            const bodyTrivia = consumeTrivia(state);
            readBlock.invalidKeyBody = parseStatementSequence(state, bodyTrivia, ["END-READ", "NOT INVALID KEY"]);
        } else if (!upper) {
            break;
        } else {
            // Unexpected content inside READ - skip
            state.pos++;
        }
    }

    return readBlock;
}

// ─── Helpers ────────────────────────────────────────────────────────────

function isParagraphName(state: ParserState, upper: string): boolean {
    // A paragraph name is a word followed by a period, that's not a known statement
    const match = upper.match(/^([A-Z0-9-]+)\.\s*$/);
    if (!match) return false;

    const name = match[1];
    // Exclude known statements and keywords
    if (AREA_B_STATEMENTS.some(s => s === name)) return false;
    if ([...INDENT_START_KEYWORDS, ...INDENT_END_KEYWORDS].some(k => k === name)) return false;
    if (name === "PERFORM" || name === "ELSE" || name === "WHEN") return false;

    return true;
}

function matchesTerminator(upper: string, terminators: string[]): boolean {
    return terminators.some(t => upper.startsWith(t));
}

function extractVerb(upper: string): string {
    const match = upper.match(/^([A-Z][\w-]*)/);
    return match ? match[1] : "";
}

function isBlockPerform(upper: string, rawText: string): boolean {
    const lineWithoutPeriod = upper.replace(/\.\s*$/, "");
    return upper.includes(" UNTIL ") ||
        upper.includes(" VARYING ") ||
        upper.includes(" TIMES ") ||
        lineWithoutPeriod.trim() === "PERFORM";
}
