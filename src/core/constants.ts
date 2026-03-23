/**
 * COBOL formatting constants and keyword lists.
 */

// ─── Fixed-form column layout ────────────────────────────────────────────────

export const SEQ_NUMBER_END = 6;
export const INDICATOR_COL = 7;
export const AREA_A_START = 8;
export const AREA_A_END = 11;
export const AREA_B_START = 12;
export const LINE_LENGTH = 80;
export const PROGRAM_TEXT_END = 72; // cols 73-80 are identification area

// ─── Division header keywords ─────────────────────────────────────────────────

export const DIVISION_KEYWORDS = [
    "IDENTIFICATION DIVISION",
    "ID DIVISION",
    "ENVIRONMENT DIVISION",
    "DATA DIVISION",
    "PROCEDURE DIVISION",
] as const;

// ─── Area A keywords ──────────────────────────────────────────────────────────

/** All keywords / entries that must start in Area A (col 8). */
export const AREA_A_KEYWORDS = [
    // Divisions
    "IDENTIFICATION DIVISION",
    "ID DIVISION",
    "ENVIRONMENT DIVISION",
    "DATA DIVISION",
    "PROCEDURE DIVISION",

    // Identification Division entries
    "PROGRAM-ID",
    "AUTHOR",
    "INSTALLATION",
    "DATE-WRITTEN",
    "DATE-COMPILED",
    "SECURITY",
    "REMARKS",

    // Environment Division sections & entries
    "CONFIGURATION SECTION",
    "INPUT-OUTPUT SECTION",
    "FILE-CONTROL",
    "I-O-CONTROL",
    "SPECIAL-NAMES",
    "REPOSITORY",               // OO COBOL / COBOL 2002+
    "SELECT",

    // Data Division sections
    "FILE SECTION",
    "WORKING-STORAGE SECTION",
    "LOCAL-STORAGE SECTION",
    "LINKAGE SECTION",
    "SCREEN SECTION",
    "REPORT SECTION",           // Report Writer
    "COMMUNICATION SECTION",    // obsolete Communication Module

    // Data division file/record descriptors
    "FD",   // File Description
    "SD",   // Sort-Merge File Description
    "RD",   // Report Description (Report Writer)
    "CD",   // Communication Description (obsolete)

    // Procedure Division structure
    "DECLARATIVES",
    "END DECLARATIVES",

    // Program scope
    "END PROGRAM",
    "END CLASS",                // OO COBOL
    "END FACTORY",
    "END OBJECT",
    "END METHOD",
] as const;

// ─── Data Division sections ───────────────────────────────────────────────────

export const DATA_SECTION_KEYWORDS = [
    "FILE SECTION",
    "WORKING-STORAGE SECTION",
    "LOCAL-STORAGE SECTION",
    "LINKAGE SECTION",
    "SCREEN SECTION",
    "REPORT SECTION",
    "COMMUNICATION SECTION",
] as const;

// ─── Special level numbers ────────────────────────────────────────────────────

/** Level numbers with special meaning — not part of the normal 01-49 hierarchy. */
export const SPECIAL_LEVEL_NUMBERS = [
    66,  // RENAMES clause
    77,  // Non-contiguous standalone item
    78,  // Named constant (MF extension)
    88,  // Condition name
] as const;

/** Level numbers that reset the data level stack to the top. */
export const RESET_LEVEL_NUMBERS = [1, 77, 78] as const;

// ─── Procedure Division verbs (Area B) ────────────────────────────────────────

/**
 * All standard COBOL procedure division verbs.
 * Used to distinguish statements from paragraph names.
 */
export const PROCEDURE_VERBS = [
    // Arithmetic
    "ADD",
    "SUBTRACT",
    "MULTIPLY",
    "DIVIDE",
    "COMPUTE",

    // Data movement
    "MOVE",
    "SET",
    "INITIALIZE",
    "INSPECT",

    // String handling
    "STRING",
    "UNSTRING",

    // I/O
    "ACCEPT",
    "DISPLAY",
    "OPEN",
    "CLOSE",
    "READ",
    "WRITE",
    "REWRITE",
    "DELETE",
    "START",

    // Control flow
    "PERFORM",
    "GO TO",
    "ALTER",        // obsolete
    "STOP",
    "GOBACK",
    "EXIT",
    "CONTINUE",

    // Program linkage
    "CALL",
    "CANCEL",
    "CHAIN",        // MF extension

    // Sort/Merge
    "SORT",
    "MERGE",
    "RELEASE",
    "RETURN",

    // Table handling
    "SEARCH",

    // Condition / evaluation
    "IF",
    "EVALUATE",

    // Report Writer
    "GENERATE",
    "INITIATE",
    "TERMINATE",
    "SUPPRESS",

    // Exception handling (COBOL 2002+)
    "RAISE",
    "RESUME",

    // Memory management (COBOL 2002+)
    "ALLOCATE",
    "FREE",

    // XML / JSON (COBOL 2014+)
    "XML GENERATE",
    "XML PARSE",
    "JSON GENERATE",
    "JSON PARSE",

    // Miscellaneous
    "COPY",
    "REPLACE",
    "EXEC",
    "EXECUTE",
] as const;

/**
 * Subset of verbs that are commonly placed in Area B (used for Area A/B disambiguation).
 * Keep the original list for backwards compatibility with the formatter logic.
 */
export const AREA_B_STATEMENTS = [
    "EXIT",
    "STOP",
    "GOBACK",
    "DISPLAY",
    "COMPUTE",
    "MOVE",
    "ADD",
    "SUBTRACT",
    "MULTIPLY",
    "DIVIDE",
    "COPY",
] as const;

// ─── Block statement structure ────────────────────────────────────────────────

/** Verbs that open an inline block requiring END-xxx termination. */
export const BLOCK_OPENERS = [
    "IF",
    "EVALUATE",
    "PERFORM",  // only when UNTIL/VARYING/TIMES or bare PERFORM (no paragraph name)
    "READ",
    "WRITE",
    "REWRITE",
    "DELETE",
    "START",
    "CALL",
    "STRING",
    "UNSTRING",
    "SEARCH",
    "COMPUTE",
    "ADD",
    "SUBTRACT",
    "MULTIPLY",
    "DIVIDE",
    "ACCEPT",
    "DISPLAY",
    "RETURN",
    "XML PARSE",
    "JSON PARSE",
] as const;

/** All scope terminators (END-xxx keywords). */
export const SCOPE_TERMINATORS = [
    "END-ACCEPT",
    "END-ADD",
    "END-CALL",
    "END-CLOSE",
    "END-COMPUTE",
    "END-DELETE",
    "END-DISPLAY",
    "END-DIVIDE",
    "END-EVALUATE",
    "END-EXEC",
    "END-IF",
    "END-INVOKE",
    "END-JSON",
    "END-MULTIPLY",
    "END-OPEN",
    "END-PERFORM",
    "END-READ",
    "END-RECEIVE",
    "END-RETURN",
    "END-REWRITE",
    "END-SEARCH",
    "END-SEND",
    "END-START",
    "END-STRING",
    "END-SUBTRACT",
    "END-UNSTRING",
    "END-WRITE",
    "END-XML",
] as const;

/** Keywords that end an indented block (used by current formatter logic). */
export const INDENT_END_KEYWORDS = SCOPE_TERMINATORS;

/** Keywords that start an indented block (current formatter logic). */
export const INDENT_START_KEYWORDS = [
    "IF",
    "READ",
    "EVALUATE",
] as const;

/** Keywords that de-indent to parent level, then re-indent their content. */
export const INDENT_ELSE_KEYWORDS = [
    "ELSE",
    "WHEN OTHER",
    "WHEN",
    "NOT AT END",
    "NOT INVALID KEY",
    "NOT ON SIZE ERROR",
    "NOT ON OVERFLOW",
    "NOT ON EXCEPTION",
] as const;

/** Keywords that indent their content but don't de-indent themselves. */
export const INDENT_SUB_CLAUSES = [
    "AT END",
    "INVALID KEY",
    "ON SIZE ERROR",
    "ON OVERFLOW",
    "ON EXCEPTION",
    "AT END-OF-PAGE",
    "AT EOP",
] as const;

// ─── Data clause keywords ─────────────────────────────────────────────────────

/** Picture/type declaration keywords. */
export const PIC_KEYWORDS = [
    "PIC",
    "PICTURE",
] as const;

/** USAGE clause values. */
export const USAGE_VALUES = [
    "BINARY",
    "BINARY-CHAR",
    "BINARY-SHORT",
    "BINARY-LONG",
    "BINARY-DOUBLE",
    "COMP",
    "COMP-1",
    "COMP-2",
    "COMP-3",
    "COMP-4",
    "COMP-5",
    "COMP-6",
    "COMPUTATIONAL",
    "COMPUTATIONAL-1",
    "COMPUTATIONAL-2",
    "COMPUTATIONAL-3",
    "COMPUTATIONAL-4",
    "COMPUTATIONAL-5",
    "DISPLAY",
    "DISPLAY-1",
    "FLOAT-SHORT",
    "FLOAT-LONG",
    "FLOAT-EXTENDED",
    "FLOAT-BINARY-32",
    "FLOAT-BINARY-64",
    "FLOAT-BINARY-128",
    "FLOAT-DECIMAL-16",
    "FLOAT-DECIMAL-34",
    "INDEX",
    "NATIONAL",
    "OBJECT REFERENCE",
    "PACKED-DECIMAL",
    "POINTER",
    "PROCEDURE-POINTER",
    "FUNCTION-POINTER",
] as const;

/** All data entry clause keywords (used to detect clause boundaries during parsing). */
export const DATA_CLAUSE_KEYWORDS = [
    "PIC",
    "PICTURE",
    "VALUE",
    "VALUES",
    "OCCURS",
    "REDEFINES",
    "RENAMES",
    "USAGE",
    "SYNCHRONIZED",
    "SYNC",
    "JUSTIFIED",
    "JUST",
    "BLANK",
    "SIGN",
    "EXTERNAL",
    "GLOBAL",
    "BASED",
    "VOLATILE",
    "ANY LENGTH",
    "CLASS",
    "DYNAMIC LENGTH",
] as const;

// ─── PERFORM modifiers ────────────────────────────────────────────────────────

export const PERFORM_MODIFIERS = [
    "UNTIL",
    "VARYING",
    "TIMES",
    "THROUGH",
    "THRU",
    "WITH TEST BEFORE",
    "WITH TEST AFTER",
] as const;

// ─── Figurative constants ─────────────────────────────────────────────────────

export const FIGURATIVE_CONSTANTS = [
    "ZERO",
    "ZEROS",
    "ZEROES",
    "SPACE",
    "SPACES",
    "HIGH-VALUE",
    "HIGH-VALUES",
    "LOW-VALUE",
    "LOW-VALUES",
    "QUOTE",
    "QUOTES",
    "NULL",
    "NULLS",
    "ALL",
] as const;

// ─── Compiler directives ──────────────────────────────────────────────────────

/** Standard COBOL 2002+ compiler directives (begin with >>). */
export const COMPILER_DIRECTIVES = [
    ">>DEFINE",
    ">>EVALUATE",
    ">>IF",
    ">>ELSE",
    ">>END-IF",
    ">>SET",
    ">>SOURCE",
    ">>TURN",
    ">>CALL-CONVENTION",
    ">>D",
] as const;

/** Micro Focus / ACUCOBOL $ directives. */
export const MF_DIRECTIVES = [
    "$SET",
    "$IF",
    "$ELSE",
    "$END",
    "$DEFINE",
    "$DISPLAY",
] as const;

// ─── OPEN modes ───────────────────────────────────────────────────────────────

export const OPEN_MODES = [
    "INPUT",
    "OUTPUT",
    "I-O",
    "EXTEND",
] as const;

// ─── Condition operators (used in IF / EVALUATE / PERFORM UNTIL) ──────────────

export const RELATION_OPERATORS = [
    "EQUAL TO",
    "EQUAL",
    "NOT EQUAL TO",
    "NOT EQUAL",
    "GREATER THAN",
    "GREATER",
    "LESS THAN",
    "LESS",
    "GREATER THAN OR EQUAL TO",
    "GREATER OR EQUAL",
    "LESS THAN OR EQUAL TO",
    "LESS OR EQUAL",
    "NOT GREATER",
    "NOT LESS",
] as const;

export const LOGICAL_OPERATORS = [
    "AND",
    "OR",
    "NOT",
] as const;
