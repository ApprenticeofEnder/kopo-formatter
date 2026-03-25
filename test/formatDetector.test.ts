import { describe, it, expect } from "vitest";
import { detectFormat } from "../src/core/formatDetector.js";

describe("detectFormat", () => {
    it("respects explicit 'fixed' override", () => {
        expect(detectFormat("anything", "fixed")).toBe("fixed");
    });

    it("respects explicit 'free' override", () => {
        expect(detectFormat("anything", "free")).toBe("free");
    });

    it("detects >>SOURCE FORMAT IS FREE directive", () => {
        const source = "      >>SOURCE FORMAT IS FREE\n      IDENTIFICATION DIVISION.";
        expect(detectFormat(source, "auto")).toBe("free");
    });

    it("detects >>SOURCE FORMAT IS FIXED directive", () => {
        const source = "      >>SOURCE FORMAT IS FIXED\n      IDENTIFICATION DIVISION.";
        expect(detectFormat(source, "auto")).toBe("fixed");
    });

    it("defaults to fixed-form when ambiguous", () => {
        const source = "       IDENTIFICATION DIVISION.";
        expect(detectFormat(source, "auto")).toBe("fixed");
    });

    it("detects free-form from keyword at column 1", () => {
        const source = [
            "IDENTIFICATION DIVISION.",
            "PROGRAM-ID. MYPROGRAM.",
        ].join("\n");
        expect(detectFormat(source, "auto")).toBe("free");
    });
});
