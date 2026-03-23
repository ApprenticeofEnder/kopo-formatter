import { describe, it, expect } from "vitest";
import { normalizeKeywords, applyCase } from "../src/core/caseNormalizer.js";
import { COBOL_RESERVED_WORDS } from "../src/core/constants.js";
import { resolveOptions } from "../src/core/options.js";
import { format } from "../src/core/index.js";

const reserved = COBOL_RESERVED_WORDS;

describe("normalizeKeywords - lowercase", () => {
    it("lowercases a simple verb", () => {
        expect(normalizeKeywords("MOVE WS-A TO WS-B", "lower", reserved))
            .toBe("move WS-A to WS-B");
    });

    it("lowercases multiple verbs on one line", () => {
        expect(normalizeKeywords("ADD 1 TO WS-COUNTER", "lower", reserved))
            .toBe("add 1 to WS-COUNTER");
    });

    it("lowercases IF / END-IF", () => {
        expect(normalizeKeywords("IF WS-A > 0", "lower", reserved))
            .toBe("if WS-A > 0");
        expect(normalizeKeywords("END-IF", "lower", reserved))
            .toBe("end-if");
    });

    it("preserves user-defined data names", () => {
        const result = normalizeKeywords("MOVE WS-COUNTER TO WS-TOTAL", "lower", reserved);
        expect(result).toContain("WS-COUNTER");
        expect(result).toContain("WS-TOTAL");
        expect(result).toContain("move");
        expect(result).toContain("to");
    });

    it("lowercases PIC and VALUE keywords", () => {
        expect(normalizeKeywords("01 WS-NAME PIC X(10) VALUE SPACES.", "lower", reserved))
            .toMatch(/pic/);
    });
});

describe("normalizeKeywords - uppercase", () => {
    it("uppercases a lowercase verb", () => {
        expect(normalizeKeywords("move ws-a to ws-b", "upper", reserved))
            .toBe("MOVE ws-a TO ws-b");
    });

    it("uppercases mixed-case keywords", () => {
        expect(normalizeKeywords("Move Ws-A To Ws-B", "upper", reserved))
            .toBe("MOVE Ws-A TO Ws-B");
    });

    it("uppercases EVALUATE and WHEN", () => {
        const result = normalizeKeywords("evaluate true when other", "upper", reserved);
        expect(result).toContain("EVALUATE");
        expect(result).toContain("WHEN");
        expect(result).toContain("OTHER");
    });
});

describe("normalizeKeywords - string literals", () => {
    it("does not touch content inside single-quoted literals", () => {
        const result = normalizeKeywords("DISPLAY 'MOVE TO IF'", "lower", reserved);
        expect(result).toBe("display 'MOVE TO IF'");
    });

    it("does not touch content inside double-quoted literals", () => {
        const result = normalizeKeywords('DISPLAY "EVALUATE WHEN"', "lower", reserved);
        expect(result).toBe('display "EVALUATE WHEN"');
    });

    it("correctly resumes normalization after a literal", () => {
        const result = normalizeKeywords("MOVE 'hello' TO WS-OUT", "lower", reserved);
        expect(result).toBe("move 'hello' to WS-OUT");
    });
});

describe("applyCase", () => {
    it("returns text unchanged when keywordCase is preserve", () => {
        const opts = resolveOptions({ keywordCase: "preserve" });
        expect(applyCase("MOVE WS-A TO WS-B", opts)).toBe("MOVE WS-A TO WS-B");
    });

    it("lowercases when keywordCase is lower", () => {
        const opts = resolveOptions({ keywordCase: "lower" });
        expect(applyCase("MOVE WS-A TO WS-B", opts)).toContain("move");
    });

    it("uppercases when keywordCase is upper", () => {
        const opts = resolveOptions({ keywordCase: "upper" });
        expect(applyCase("move ws-a to ws-b", opts)).toContain("MOVE");
    });
});

describe("integration - keywordCase in format()", () => {
    const source = [
        "       IDENTIFICATION DIVISION.",
        "       PROGRAM-ID. MYPROG.",
        "       PROCEDURE DIVISION.",
        "       MAIN-PARA.",
        "           MOVE ZEROS TO WS-COUNTER.",
        "           STOP RUN.",
    ].join("\n");

    it("uppercases all reserved words when keywordCase is upper", () => {
        const result = format(source, { sourceFormat: "fixed", keywordCase: "upper" });
        expect(result).toContain("IDENTIFICATION DIVISION");
        expect(result).toContain("MOVE");
        expect(result).toContain("STOP");
    });

    it("lowercases all reserved words when keywordCase is lower", () => {
        const result = format(source, { sourceFormat: "fixed", keywordCase: "lower" });
        expect(result).toMatch(/identification division/i);
        // Verbs should be lowercase
        const moveLines = result.split("\n").filter(l => l.includes("WS-COUNTER"));
        expect(moveLines[0]).toMatch(/move/);
    });

    it("does not change casing when keywordCase is preserve", () => {
        const result = format(source, { sourceFormat: "fixed", keywordCase: "preserve" });
        expect(result).toContain("IDENTIFICATION DIVISION");
        expect(result).toContain("MOVE ZEROS TO WS-COUNTER");
    });
});
