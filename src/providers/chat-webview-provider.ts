import * as vscode from 'vscode';
import { SessionManager } from '../chat/session-manager';
import { CHAT_TIMEOUT_MS, CHAT_VIEW_ID, type EditorActionType } from '../constants';
import { getSettings, saveSettings, type ExtensionSettings } from '../config/settings';
import {
    getUiStrings,
    tInsertCodeFailed,
    tInsertCodeSuccess,
    tNoCodeToInsert,
} from '../i18n/ui-strings';
import { AiService } from '../services/ai-service';
import type { InsertContext } from '../types/editor';
import { extractCodeBlock } from '../utils/extract-code';
import { sleep } from '../utils/sleep';
import { getChatPanelHtml, type WebviewToExtensionMessage } from '../webview/chat-panel';

export interface EditorActionOptions {
    action?: EditorActionType;
    insertContext?: InsertContext;
}

export class ChatViewProvider implements vscode.WebviewViewProvider {
    private view?: vscode.WebviewView;
    private readonly sessionManager: SessionManager;
    private readonly aiService: AiService;
    private pendingInsertContext?: InsertContext;
    private pendingAction?: EditorActionType;

    constructor(
        private readonly extensionContext: vscode.ExtensionContext,
        private readonly extensionUri: vscode.Uri,
        aiService = new AiService()
    ) {
        this.sessionManager = new SessionManager(extensionContext);
        this.aiService = aiService;
    }

    resolveWebviewView(webviewView: vscode.WebviewView): void {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri],
        };

        webviewView.webview.html = getChatPanelHtml();

        webviewView.webview.onDidReceiveMessage(async (data: WebviewToExtensionMessage) => {
            switch (data.type) {
                case 'ready':
                    this.sendUiStrings();
                    this.sendSessionsState();
                    this.sendCurrentSessionMessages();
                    break;
                case 'load-settings':
                    this.sendSettingsToWebview();
                    break;
                case 'save-settings':
                    await this.handleSaveSettings(data.settings);
                    break;
                case 'new-session':
                    this.clearPendingInsert();
                    this.sessionManager.createSession();
                    this.sendSessionsState();
                    this.view?.webview.postMessage({ type: 'load-session', messages: [] });
                    break;
                case 'switch-session':
                    this.clearPendingInsert();
                    if (this.sessionManager.switchSession(data.sessionId)) {
                        this.sendSessionsState();
                        this.sendCurrentSessionMessages();
                    }
                    break;
                case 'delete-session':
                    this.sessionManager.deleteSession(data.sessionId);
                    this.sendSessionsState();
                    this.sendCurrentSessionMessages();
                    break;
                case 'clear-chat':
                    this.clearPendingInsert();
                    this.sessionManager.clearCurrentSession();
                    this.sendSessionsState();
                    this.view?.webview.postMessage({ type: 'load-session', messages: [] });
                    break;
                case 'user-input':
                    this.clearPendingInsert();
                    await this.sendChatMessage(data.value, false);
                    break;
                case 'insert-code':
                    await this.insertCodeIntoEditor(data.code);
                    break;
            }
        });
    }

    private clearPendingInsert(): void {
        this.pendingInsertContext = undefined;
        this.pendingAction = undefined;
    }

    private sendUiStrings(): void {
        this.view?.webview.postMessage({ type: 'ui-strings', strings: getUiStrings() });
    }

    private sendSessionsState(): void {
        this.view?.webview.postMessage({
            type: 'sessions-data',
            sessions: this.sessionManager.getSessionSummaries(),
        });
    }

    private sendCurrentSessionMessages(): void {
        this.view?.webview.postMessage({
            type: 'load-session',
            messages: this.sessionManager.getMessages(),
        });
    }

    private sendSettingsToWebview(): void {
        if (!this.view) {
            return;
        }

        const settings = getSettings();
        this.view.webview.postMessage({
            type: 'settings-data',
            settings,
            hasApiKey: Boolean(settings.apiKey),
        });
    }

    private async handleSaveSettings(settings: ExtensionSettings): Promise<void> {
        if (!this.view) {
            return;
        }

        const strings = getUiStrings();

        try {
            await saveSettings(settings);
            this.sendSettingsToWebview();
            this.view.webview.postMessage({ type: 'settings-saved', success: true });
            vscode.window.showInformationMessage(strings.settingsSavedToast);
        } catch (error) {
            const message = error instanceof Error ? error.message : strings.settingsSaveFailed;
            this.view.webview.postMessage({ type: 'settings-saved', success: false, message });
        }
    }

    async focus(): Promise<void> {
        if (this.view) {
            this.view.show(true);
            return;
        }

        await vscode.commands.executeCommand(`${CHAT_VIEW_ID}.focus`);
    }

    async handleAction(fullQuery: string, options?: EditorActionOptions): Promise<void> {
        this.pendingAction = options?.action;
        this.pendingInsertContext = options?.insertContext;

        await this.focus();
        await sleep(100);

        if (!this.view) {
            return;
        }

        this.view.webview.postMessage({ type: 'add-user-message', value: fullQuery });
        await this.sendChatMessage(fullQuery, false);
    }

    private async sendChatMessage(query: string, displayUserMessage = true): Promise<void> {
        if (!this.view) {
            return;
        }

        if (displayUserMessage) {
            this.view.webview.postMessage({ type: 'add-user-message', value: query });
        }

        this.sessionManager.addUserMessage(query);
        this.sendSessionsState();
        this.view.webview.postMessage({ type: 'stream-start' });

        const strings = getUiStrings();
        const action = this.pendingAction;
        const insertContext = this.pendingInsertContext;

        try {
            const content = await this.aiService.chatCompletionStream(
                {
                    messages: this.sessionManager.getMessages(),
                    timeout: CHAT_TIMEOUT_MS,
                },
                (_delta, full) => {
                    this.view?.webview.postMessage({ type: 'stream-chunk', full });
                }
            );

            const finalContent = content || strings.emptyApiResponse;
            this.sessionManager.addAssistantMessage(finalContent);
            this.sendSessionsState();

            const insertCode =
                action === 'generate-comment' && insertContext
                    ? extractCodeBlock(finalContent)
                    : undefined;

            this.view.webview.postMessage({
                type: 'stream-end',
                full: finalContent,
                insertCode,
            });
        } catch (error) {
            this.clearPendingInsert();
            this.sessionManager.removeLastMessage();
            this.sendSessionsState();
            const errorMessage = this.aiService.formatError(error);
            this.view.webview.postMessage({
                type: 'stream-error',
                value: errorMessage,
            });
        }
    }

    private async insertCodeIntoEditor(code: string): Promise<void> {
        const context = this.pendingInsertContext;
        if (!context) {
            vscode.window.showWarningMessage(tNoCodeToInsert());
            return;
        }

        try {
            const uri = vscode.Uri.parse(context.uri);
            const document = await vscode.workspace.openTextDocument(uri);
            const editor = await vscode.window.showTextDocument(document, { preview: false });

            const range = new vscode.Range(
                context.startLine,
                context.startCharacter,
                context.endLine,
                context.endCharacter
            );

            const applied = await editor.edit(editBuilder => {
                editBuilder.replace(range, code);
            });

            if (!applied) {
                vscode.window.showErrorMessage(tInsertCodeFailed());
                return;
            }

            this.clearPendingInsert();
            vscode.window.showInformationMessage(tInsertCodeSuccess());
        } catch (error) {
            const message = error instanceof Error ? error.message : tInsertCodeFailed();
            vscode.window.showErrorMessage(message);
        }
    }
}
