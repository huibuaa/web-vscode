import * as vscode from 'vscode';
import { registerEditorCommands } from './commands/register-commands';
import { CHAT_VIEW_ID } from './constants';
import { ChatViewProvider } from './providers/chat-webview-provider';
import { CompletionProvider } from './providers/completion-provider';

export function activate(context: vscode.ExtensionContext): void {
    console.log('Web-VSCode is now active!');

    const chatProvider = new ChatViewProvider(context, context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(CHAT_VIEW_ID, chatProvider)
    );

    context.subscriptions.push(
        vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, new CompletionProvider())
    );

    registerEditorCommands(context, chatProvider);
}

export function deactivate(): void {}
