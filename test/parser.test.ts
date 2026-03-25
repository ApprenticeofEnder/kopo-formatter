import { describe, it, expect } from "vitest";
import { parseSource } from "../src/core/index.js";
import type { Division, Section, DataEntry } from "../src/core/types.js";

const FIXED_PROGRAM = `\
       IDENTIFICATION DIVISION.
       PROGRAM-ID. MYPROGRAM.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-COUNTER     PIC 9(5)    VALUE ZEROS.
       01  WS-NAME        PIC X(30).
           05  WS-FIRST   PIC X(15).
           05  WS-LAST    PIC X(15).
       PROCEDURE DIVISION.
           MAIN-PARA.
           MOVE ZEROS TO WS-COUNTER.
           STOP RUN.
`;

describe("parser - top level", () => {
    it("parses SourceFile with correct format", () => {
        const ast = parseSource(FIXED_PROGRAM);
        expect(ast.kind).toBe("SourceFile");
        expect(ast.format).toBe("fixed");
    });

    it("finds all 3 divisions", () => {
        const ast = parseSource(FIXED_PROGRAM);
        const divisions = ast.children.filter(c => c.kind === "Division") as Division[];
        const divTypes = divisions.map(d => d.divisionType);
        expect(divTypes).toContain("IdentificationDivision");
        expect(divTypes).toContain("DataDivision");
        expect(divTypes).toContain("ProcedureDivision");
    });
});

describe("parser - data division", () => {
    it("finds WORKING-STORAGE SECTION", () => {
        const ast = parseSource(FIXED_PROGRAM);
        const dataDivision = ast.children.find(
            c => c.kind === "Division" && (c as Division).divisionType === "DataDivision"
        ) as Division | undefined;
        expect(dataDivision).toBeDefined();

        const wsSection = dataDivision!.children.find(
            c => c.kind === "Section" && (c as Section).name.includes("WORKING-STORAGE")
        ) as Section | undefined;
        expect(wsSection).toBeDefined();
    });

    it("parses 01-level data entries", () => {
        const ast = parseSource(FIXED_PROGRAM);
        const dataDivision = ast.children.find(
            c => c.kind === "Division" && (c as Division).divisionType === "DataDivision"
        ) as Division;
        const wsSection = dataDivision.children.find(
            c => c.kind === "Section"
        ) as Section;

        const entries = wsSection.children.filter(c => c.kind === "DataEntry") as DataEntry[];
        expect(entries.length).toBeGreaterThan(0);

        const counter = entries.find(e => e.name.toUpperCase().includes("WS-COUNTER"));
        expect(counter).toBeDefined();
        expect(counter!.level).toBe(1);
    });
});

describe("parser - procedure division", () => {
    it("finds PROCEDURE DIVISION", () => {
        const ast = parseSource(FIXED_PROGRAM);
        const procDiv = ast.children.find(
            c => c.kind === "Division" && (c as Division).divisionType === "ProcedureDivision"
        ) as Division | undefined;
        expect(procDiv).toBeDefined();
    });

    it("finds paragraph", () => {
        const ast = parseSource(FIXED_PROGRAM);
        const procDiv = ast.children.find(
            c => c.kind === "Division" && (c as Division).divisionType === "ProcedureDivision"
        ) as Division;

        const para = procDiv.children.find(c => c.kind === "Paragraph");
        expect(para).toBeDefined();
    });
});
