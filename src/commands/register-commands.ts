import * as vscode from 'vscode';
import { COMMANDS, EDITOR_ACTIONS } from '../constants';
import { tNoActiveEditor, tSelectCodeSection } from '../i18n/ui-strings';
import {
    createPromptCodeExplain,
    createPromptFixBugs,
    createPromptGenerateComment,
    createPromptGenerateUnitTest,
    createPromptUseCaseAnalysis,
} from '../prompts/l10n-prompts';
import type { ChatViewProvider } from '../providers/chat-webview-provider';
import type { InsertContext } from '../types/editor';

function buildInsertContext(editor: vscode.TextEditor): InsertContext {
    const { selection, document } = editor;
    return {
        uri: document.uri.toString(),
        startLine: selection.start.line,
        startCharacter: selection.start.character,
        endLine: selection.end.line,
        endCharacter: selection.end.character,
    };
}

function buildEditorPrompt(action: (typeof EDITOR_ACTIONS)[number]['action'], language: string, code: string): string {
    switch (action) {
        case 'explain':
            return createPromptCodeExplain(language, code);
        case 'use-case':
            return createPromptUseCaseAnalysis(language, code);
        case 'generate-comment':
            return createPromptGenerateComment(language, code);
        case 'unit-test':
            return createPromptGenerateUnitTest(language, code);
        case 'fix-bugs':
            return createPromptFixBugs(language, code);
    }
}

export function registerEditorCommands(
    context: vscode.ExtensionContext,
    chatProvider: ChatViewProvider
): void {
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMANDS.CHAT_FOCUS, () => chatProvider.focus())
    );

    for (const action of EDITOR_ACTIONS) {
        context.subscriptions.push(
            vscode.commands.registerCommand(action.command, async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage(tNoActiveEditor());
                    return;
                }

                const selection = editor.document.getText(editor.selection);
                if (!selection) {
                    vscode.window.showWarningMessage(tSelectCodeSection());
                    return;
                }

                const language = editor.document.languageId || 'text';
                const prompt = buildEditorPrompt(action.action, language, selection);
                await chatProvider.handleAction(prompt, {
                    action: action.action,
                    insertContext:
                        action.action === 'generate-comment' ? buildInsertContext(editor) : undefined,
                });
            })
        );
    }
}
