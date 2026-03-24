/**
 * VS Code extension entry point.
 * Thin wrapper that wires the formatter core into VS Code's formatting API.
 */

import * as vscode from "vscode";
import { format, type FormatterOptions } from "./core/index.js";

export function activate(context: vscode.ExtensionContext): void {
    console.log(`KOPO Formatter: activating... (build ${new Date().toISOString()})`);

    const disposable = vscode.languages.registerDocumentFormattingEditProvider(
        "COBOL",
        {
            provideDocumentFormattingEdits(
                document: vscode.TextDocument,
                formattingOptions: vscode.FormattingOptions,
            ): vscode.TextEdit[] | null {
                const settings = vscode.workspace.getConfiguration("kopo-formatter");

                const options: Partial<FormatterOptions> = {
                    // VS Code's editor.tabSize takes priority; fall back to the kopo setting
                    indentationSpaces: formattingOptions.tabSize
                        ?? settings.get<number>("indentationSpaces"),
                    addEmptyLineAfterExit: settings.get<boolean>("addEmptyLineAfterExit"),
                    addEmptyLineAfterDivision: settings.get<boolean>("addEmptyLineAfterDivision"),
                    addEmptyLineAfterSection: settings.get<boolean>("addEmptyLineAfterSection"),
                    omitContinuationLines: settings.get<boolean>("omitContinuationLines"),
                    evaluateIndentWhen: settings.get<boolean>("evaluateIndentWhen"),
                    alignPicClauses: settings.get<boolean>("alignPicClauses"),
                    sourceFormat: settings.get<"auto" | "fixed" | "free">("sourceFormat"),
                    keywordCase: settings.get<"upper" | "lower" | "preserve">("keywordCase"),
                    normalizeWhitespace: settings.get<boolean>("normalizeWhitespace"),
                    wrapLongLines: settings.get<boolean>("wrapLongLines"),
                    uppercaseProcedureNames: settings.get<boolean>("uppercaseProcedureNames"),
                    alignDelimitedBy: settings.get<boolean>("alignDelimitedBy"),
                };

                const text = document.getText();
                try {
                    const formattedText = format(text, options);
                    const wholeDocument = new vscode.Range(
                        document.positionAt(0),
                        document.positionAt(text.length),
                    );
                    return [vscode.TextEdit.replace(wholeDocument, formattedText)];
                } catch (err) {
                    vscode.window.showErrorMessage(
                        "KOPO Formatter failed to format the document.",
                    );
                    console.error(err);
                    return null;
                }
            },
        },
    );

    console.log("KOPO Formatter: activated");
    context.subscriptions.push(disposable);
}

export function deactivate(): void {}
