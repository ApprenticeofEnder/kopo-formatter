# Code Review Report: kopo-formatter

**Date:** 2026-03-24
**Branch:** dev (commit ded9ecd — v0.3.0)
**Reviewer:** Claude (automated review)

---

## 1. Overview

kopo-formatter is a COBOL source code formatter implemented in TypeScript with VS Code integration. The architecture follows a clean three-phase pipeline:

```
Source Text → Scanner → Parser → Printer → Formatted Text
```

The codebase consists of 17 source files organized under `src/`:

| Path                                     | Purpose                          |
| ---------------------------------------- | -------------------------------- |
| `core/index.ts`                          | Public API entry point           |
| `core/types.ts`                          | AST node type definitions        |
| `core/constants.ts`                      | COBOL keywords and configuration |
| `core/options.ts`                        | Formatter options interface      |
| `core/tokens.ts`                         | Scanner token types              |
| `core/scanner.ts`                        | Fixed/free-form source scanner   |
| `core/formatDetector.ts`                 | Source format auto-detection     |
| `core/layout.ts`                         | Line construction helpers        |
| `core/caseNormalizer.ts`                 | Keyword case normalization       |
| `core/parser.ts`                         | Main recursive descent parser    |
| `core/parser/dataDivisionParser.ts`      | Data Division parser             |
| `core/parser/miscDivisionParser.ts`      | ID/Environment Division parser   |
| `core/parser/procedureDivisionParser.ts` | Procedure Division parser        |
| `core/printer.ts`                        | Main AST printer/formatter       |
| `core/printer/dataPrinter.ts`            | Data Division printer            |
| `core/printer/procedurePrinter.ts`       | Procedure Division printer       |
| `extension.ts`                           | VS Code extension entry point    |

---

## 2. Quality Summary

| File                         | Quality   | Risk   |
| ---------------------------- | --------- | ------ |
| `index.ts`                   | Good      | Low    |
| `types.ts`                   | Excellent | Low    |
| `constants.ts`               | Excellent | Low    |
| `options.ts`                 | Good      | Medium |
| `tokens.ts`                  | Good      | Low    |
| `scanner.ts`                 | Very Good | Medium |
| `formatDetector.ts`          | Good      | Medium |
| `layout.ts`                  | Excellent | Low    |
| `caseNormalizer.ts`          | Very Good | Low    |
| `parser.ts`                  | Very Good | Medium |
| `dataDivisionParser.ts`      | Very Good | Medium |
| `miscDivisionParser.ts`      | Good      | Low    |
| `procedureDivisionParser.ts` | Very Good | Medium |
| `printer.ts`                 | Very Good | Medium |
| `dataPrinter.ts`             | Very Good | Low    |
| `procedurePrinter.ts`        | Excellent | Low    |
| `extension.ts`               | Good      | Low    |

**Overall:** The codebase is well-structured, with clear separation of concerns and good TypeScript usage. Most files are "Very Good" or better. The main risks are in parser fragility and edge-case handling, not in fundamental design.

---

## 3. Strengths

### 3.1 Clean Architecture

The scanner/parser/printer pipeline is a proven compiler-construction pattern. Each phase has a single responsibility and communicates through well-defined interfaces (`SourceLine[]`, `SourceFile` AST, formatted `string`).

### 3.2 Excellent Type Definitions

`types.ts` provides a thorough, well-documented AST. Union types (`ProcedureStatement`, `DivisionChild`) give compile-time safety. Node shapes are descriptive and self-documenting.

### 3.3 Comprehensive COBOL Keyword Coverage

`constants.ts` covers COBOL 2002+, MF extensions, and ACUCOBOL dialects. Smart use of `Set<string>` for O(1) reserved-word lookup.

### 3.4 Tolerant Parsing

Unrecognized constructs degrade gracefully to `UnparsedLine` nodes rather than crashing. This is essential for a formatter that must handle real-world, non-standard COBOL.

### 3.5 Fixed/Free-Form Awareness

The formatter correctly handles both COBOL source formats, including auto-detection, tab expansion, and continuation-line joining.

---

## 4. Issues Found

### 4.1 Critical

#### 4.1.1 AND/OR Continuation Line Collection (procedureDivisionParser.ts)

AND/OR detection for multi-line conditions only looks at the next line. If a condition spans 3+ lines where AND appears on the second line but the third line has neither AND nor OR, the third line is not collected as a continuation. This can cause incorrect formatting of complex WHERE/WHEN clauses.

#### 4.1.2 Period-Termination Scope Closing

The parser assumes a period inside a block closes ALL open scopes. While this is correct per the COBOL standard, the printer does not always handle this consistently across all block types (e.g., ELSE is still printed for period-terminated IF blocks).

### 4.2 Medium

#### 4.2.1 Fragile Trivia Rollback Pattern

Multiple parsers use `state.pos -= trivia.length` to "put back" consumed trivia. This is error-prone — if trivia is consumed in separate calls or a trivia item spans multiple logical units, the count can be incorrect. A proper lookahead or peek mechanism would be safer.

**Affected files:**

- `dataDivisionParser.ts`
- `miscDivisionParser.ts`
- `procedureDivisionParser.ts`

#### 4.2.2 No Option Validation (options.ts)

`resolveOptions()` accepts any partial options without validation. Invalid values (negative `indentationSpaces`, non-integer `tabSize`) are silently accepted and will produce malformed output.

**Recommendation:** Add runtime checks:

```typescript
if (opts.indentationSpaces !== undefined && opts.indentationSpaces < 1) {
    throw new Error("indentationSpaces must be >= 1");
}
```

#### 4.2.3 Brittle Data Division Clause Extraction (dataDivisionParser.ts)

Clause extraction (PIC, VALUE, OCCURS, REDEFINES) uses overlapping regex searches with no handling for malformed clauses. The VALUE clause match does not stop at proper boundaries, which could misparse entries with multiple clauses on one line.

#### 4.2.4 Line Wrapping Assumptions (printer.ts)

`findSplitPoint()` does not account for:

- Multi-word COBOL verbs (XML GENERATE, JSON PARSE)
- COBOL continuation syntax constraints (level numbers must stay with their data names)
- The edge case where `FIXED_CONTENT_MAX` (65 chars) is too small for continuation indent + one token

#### 4.2.5 Format Auto-Detection Heuristics (formatDetector.ts)

- Only examines the first 20 lines
- Defaults to fixed-form for ambiguous input (may surprise free-form users)
- Numeric data in columns 1-6 could cause misclassification

### 4.3 Low

#### 4.3.1 Unchecked Type Casts

Several locations use `as` casts that bypass TypeScript's type system:

- `dataDivisionParser.ts`: `as CopyStatement`, `as UnparsedLine`
- `printer.ts`: `as { rawText: string }`

**Recommendation:** Replace with type guards or discriminated union checks.

#### 4.3.2 Inconsistent Continuation Line Handling

- Data Division joins continuation lines with a single space
- Procedure Division stores them as a separate `continuationLines` array
- This inconsistency means the same logical construct is represented differently in the AST depending on which division it appears in

#### 4.3.3 Extension Error Handling (extension.ts)

- Error messages are generic and do not include failure details
- No logging of which formatter options are in effect
- Falls back to `settings.get<number>()` without null-coalescing defaults

#### 4.3.4 Keyword Duplication in Constants

Some keywords appear in multiple lists (e.g., `AREA_A_KEYWORDS` and `DIVISION_KEYWORDS`). While functionally harmless, this increases maintenance burden.

#### 4.3.5 caseNormalizer Edge Cases

- Trailing hyphen stripping logic could be clearer
- String literal detection is duplicated between `normalizeCase()` and `normalizeSpaces()`
- No handling for doubled-quote escaping within COBOL string literals

---

## 5. Cross-Cutting Concerns

### 5.1 Error Recovery and Reporting

All three division parsers have limited error recovery. Unrecognized lines silently become `UnparsedLine` nodes with no error context (line number, expected syntax). The formatter never reports what it failed to parse.

**Recommendation:** Collect parsing diagnostics and surface them as VS Code warnings, or return them alongside the formatted output.

### 5.2 COBOL Feature Coverage Gaps

The following COBOL features are not explicitly handled:

- SCREEN SECTION / ACCEPT/DISPLAY screen formatting
- REPORT SECTION structure
- OO COBOL (CLASS-ID, METHOD-ID)
- EXEC/EXECUTE blocks (treated as simple statements)
- COPY ... REPLACING (preserved verbatim)

These should be implemented.

### 5.3 Performance

- No benchmarks or profiling data exist
- Alignment pre-pass requires two traversals of data entries
- Large files with deep nesting could be slow
- The entire document is processed synchronously (no streaming)

For most COBOL programs (hundreds to low thousands of lines), performance should be adequate. For very large generated COBOL (10k+ lines), profiling is recommended.

### 5.4 Test Coverage

No test files were found in `src/`. Automated tests (if they exist) should be expanded to cover:

- Period-terminated blocks
- Nested PERFORM blocks
- Complex multi-line conditions (AND/OR spanning 3+ lines)
- Edge cases in format auto-detection
- Invalid option values

---

## 6. Recommendations

### Priority 1 (Should Fix)

1. **Fix AND/OR continuation collection** to handle 3+ line conditions
2. **Add option validation** in `resolveOptions()` with clear error messages
3. **Refactor trivia handling** — replace `state.pos -= trivia.length` rollback with a peek/lookahead mechanism

### Priority 2 (Should Improve)

4. **Add parsing diagnostics** — collect and report issues rather than silently falling back to `UnparsedLine`
5. **Improve line wrapping** — handle multi-word verbs and minimum-content edge cases
6. **Replace `as` casts** with type guards or refined union types

### Priority 3 (Nice to Have)

7. **Unify continuation line representation** across divisions
8. **Improve format detection** — increase scan range, allow user override
9. **Add logging** to the VS Code extension for debugging
10. **Document COBOL feature coverage** — explicitly list supported/unsupported constructs
11. **Add performance benchmarks** for large file formatting

---

## 7. Conclusion

The kopo-formatter codebase is well-designed and demonstrates strong software engineering. The three-phase pipeline architecture is sound, types are thorough, and COBOL keyword coverage is comprehensive. The main areas for improvement are parser robustness (trivia rollback, multi-line continuation, error reporting) and defensive validation of inputs. None of the issues found are show-stoppers — the formatter should work correctly for the vast majority of well-formed COBOL programs.
