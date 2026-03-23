import { describe, it, expect } from "vitest";
import { scan } from "../src/core/scanner.js";

describe("scanner - fixed form", () => {
    it("handles blank lines", () => {
        const lines = scan("      \n", "fixed");
        expect(lines[0].isBlank).toBe(true);
    });

    it("detects comment lines (* in col 7)", () => {
        const lines = scan("      * This is a comment", "fixed");
        expect(lines[0].isComment).toBe(true);
        expect(lines[0].indicator).toBe("*");
        expect(lines[0].text).toContain("This is a comment");
    });

    it("detects comment lines (/ in col 7)", () => {
        const lines = scan("      / Page eject", "fixed");
        expect(lines[0].isComment).toBe(true);
        expect(lines[0].indicator).toBe("/");
    });

    it("strips sequence area (cols 1-6)", () => {
        const lines = scan("000010 IDENTIFICATION DIVISION.", "fixed");
        expect(lines[0].text).toContain("IDENTIFICATION DIVISION.");
        expect(lines[0].text).not.toContain("000010");
    });

    it("extracts program text from cols 8-72", () => {
        const source = "       MOVE WS-A TO WS-B.";
        const lines = scan(source, "fixed");
        expect(lines[0].isComment).toBe(false);
        expect(lines[0].text.trim()).toBe("MOVE WS-A TO WS-B.");
    });

    it("joins continuation lines (- in col 7)", () => {
        const source = [
            "       MOVE 'HELLO WORLD'",
            "      -    ' APPENDED' TO WS-STR.",
        ].join("\n");
        const lines = scan(source, "fixed");
        // Continuation should be merged into the previous line
        expect(lines.length).toBe(1);
        expect(lines[0].text).toContain("APPENDED");
    });

    it("converts tabs to spaces", () => {
        const source = "      \tMOVE WS-A TO WS-B.";
        const lines = scan(source, "fixed");
        expect(lines[0].text).not.toContain("\t");
    });
});

describe("scanner - free form", () => {
    it("treats entire line as program text", () => {
        const lines = scan("IDENTIFICATION DIVISION.", "free");
        expect(lines[0].text).toBe("IDENTIFICATION DIVISION.");
    });

    it("detects *> comments", () => {
        const lines = scan("*> This is a free-form comment", "free");
        expect(lines[0].isComment).toBe(true);
    });

    it("handles blank lines", () => {
        const lines = scan("  \n", "free");
        expect(lines[0].isBlank).toBe(true);
    });
});
