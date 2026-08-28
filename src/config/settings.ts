import * as vscode from 'vscode';
import { tMissingApiKey, tMissingApiUrl, tMissingModel } from '../i18n/ui-strings';

export const CONFIG_SECTION = 'web-vscode';

export interface ExtensionSettings {
    apiUrl: string;
    apiKey: string;
    model: string;
    autoTriggerCompletion: boolean;
    completionMaxTokens: number;
}

export function getSettings(): ExtensionSettings {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);

    return {
        apiUrl: (config.get<string>('apiUrl') ?? '').trim(),
        apiKey: (config.get<string>('apiKey') ?? '').trim(),
        model: (config.get<string>('model') ?? '').trim(),
        autoTriggerCompletion: config.get<boolean>('autoTriggerCompletion', true),
        completionMaxTokens: config.get<number>('completionMaxTokens') ?? 256,
    };
}

export function validateSettings(settings: ExtensionSettings): string | undefined {
    if (!settings.apiKey) {
        return tMissingApiKey();
    }
    if (!settings.apiUrl) {
        return tMissingApiUrl();
    }
    if (!settings.model) {
        return tMissingModel();
    }
    return undefined;
}

export async function saveSettings(
    updates: Partial<ExtensionSettings>,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
): Promise<void> {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);

    if (updates.apiUrl !== undefined) {
        await config.update('apiUrl', updates.apiUrl.trim(), target);
    }
    if (updates.apiKey !== undefined) {
        await config.update('apiKey', updates.apiKey.trim(), target);
    }
    if (updates.model !== undefined) {
        await config.update('model', updates.model.trim(), target);
    }
    if (updates.autoTriggerCompletion !== undefined) {
        await config.update('autoTriggerCompletion', updates.autoTriggerCompletion, target);
    }
    if (updates.completionMaxTokens !== undefined) {
        await config.update('completionMaxTokens', updates.completionMaxTokens, target);
    }
}
