import * as vscode from 'vscode';
import {
    COMPLETION_CONTEXT_LINES,
    COMPLETION_STOP_WORDS,
    COMPLETION_SYSTEM_PROMPT,
    COMPLETION_TIMEOUT_MS,
} from '../constants';
import { getSettings } from '../config/settings';
import { AiService } from '../services/ai-service';
import type { ChatMessage } from '../types/ai';

export class CompletionProvider implements vscode.InlineCompletionItemProvider {
    constructor(private readonly aiService = new AiService()) {}

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<vscode.InlineCompletionItem[]> {
        console.log(`>>> Web-VSCode: 正在调用补全逻辑 (行: ${position.line}, 字符: ${position.character})`);

        const { autoTriggerCompletion, completionMaxTokens } = getSettings();
        if (!autoTriggerCompletion) {
            return [];
        }

        const prefix = document.getText(
            new vscode.Range(
                new vscode.Position(Math.max(0, position.line - COMPLETION_CONTEXT_LINES), 0),
                position
            )
        );

        if (!prefix.trim()) {
            return [];
        }

        try {
            const messages: ChatMessage[] = [
                { role: 'system', content: COMPLETION_SYSTEM_PROMPT },
                { role: 'user', content: prefix },
            ];

            const completionText = await this.aiService.chatCompletion({
                messages,
                maxTokens: completionMaxTokens,
                temperature: 0.1,
                stop: COMPLETION_STOP_WORDS,
                timeout: COMPLETION_TIMEOUT_MS,
            });

            if (!completionText) {
                return [];
            }

            console.log(
                `>>> Web-VSCode: 补全结果 (行: ${position.line}, 字符: ${position.character}): ${completionText}`
            );

            return [new vscode.InlineCompletionItem(completionText, new vscode.Range(position, position))];
        } catch (error) {
            console.error('Code Completion Error:', error instanceof Error ? error.message : error);
            return [];
        }
    }
}
