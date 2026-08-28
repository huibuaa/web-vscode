import { l10n } from 'vscode';

export interface UiStrings {
    appTitle: string;
    appSubtitle: string;
    welcomeTitle: string;
    welcomeDesc: string;
    tipEnter: string;
    tipShiftEnter: string;
    tipContextMenu: string;
    inputPlaceholder: string;
    inputHint: string;
    btnSend: string;
    btnClear: string;
    btnSettings: string;
    btnHistory: string;
    btnNewSession: string;
    btnBack: string;
    btnDelete: string;
    labelYou: string;
    labelAi: string;
    labelError: string;
    settingsTitle: string;
    settingsApiKey: string;
    settingsApiKeyDesc: string;
    settingsApiUrl: string;
    settingsModel: string;
    settingsAutoCompletion: string;
    settingsMaxTokens: string;
    settingsSave: string;
    settingsCancel: string;
    settingsSaved: string;
    settingsSaveFailed: string;
    sessionHistory: string;
    sessionNewChat: string;
    sessionEmpty: string;
    sessionNoSessions: string;
    emptyApiResponse: string;
    settingsSavedToast: string;
    btnInsertCode: string;
    insertCodeSuccess: string;
    insertCodeFailed: string;
    noCodeToInsert: string;
}

export function getUiStrings(): UiStrings {
    return {
        appTitle: l10n.t('Web-VSCode AI'),
        appSubtitle: l10n.t('Code assistant · Chat · Completion'),
        welcomeTitle: l10n.t('How can I help you?'),
        welcomeDesc: l10n.t('Ask code questions, or select code in the editor and use the context menu'),
        tipEnter: l10n.t('Send message'),
        tipShiftEnter: l10n.t('New line'),
        tipContextMenu: l10n.t('Context menu · Explain / Test / Fix'),
        inputPlaceholder: l10n.t('Enter a question or code instruction...'),
        inputHint: l10n.t('Enter to send · Shift+Enter for new line'),
        btnSend: l10n.t('Send'),
        btnClear: l10n.t('Clear'),
        btnSettings: l10n.t('Settings'),
        btnHistory: l10n.t('History'),
        btnNewSession: l10n.t('New Chat'),
        btnBack: l10n.t('Back'),
        btnDelete: l10n.t('Delete'),
        labelYou: l10n.t('You'),
        labelAi: l10n.t('Web-VSCode'),
        labelError: l10n.t('Error'),
        settingsTitle: l10n.t('Extension Settings'),
        settingsApiKey: l10n.t('API Key'),
        settingsApiKeyDesc: l10n.t('API key for DeepSeek or another OpenAI-compatible service'),
        settingsApiUrl: l10n.t('API URL'),
        settingsModel: l10n.t('Model'),
        settingsAutoCompletion: l10n.t('Auto code completion'),
        settingsMaxTokens: l10n.t('Completion max tokens'),
        settingsSave: l10n.t('Save'),
        settingsCancel: l10n.t('Cancel'),
        settingsSaved: l10n.t('Settings saved'),
        settingsSaveFailed: l10n.t('Failed to save settings'),
        sessionHistory: l10n.t('Chat History'),
        sessionNewChat: l10n.t('New Chat'),
        sessionEmpty: l10n.t('No messages yet'),
        sessionNoSessions: l10n.t('No saved conversations'),
        emptyApiResponse: l10n.t('API returned no content'),
        settingsSavedToast: l10n.t('Web-VSCode settings saved'),
        btnInsertCode: l10n.t('Insert into editor'),
        insertCodeSuccess: l10n.t('Comments inserted into editor'),
        insertCodeFailed: l10n.t('Failed to insert code into editor'),
        noCodeToInsert: l10n.t('No code block found to insert'),
    };
}

export function tNoActiveEditor(): string {
    return l10n.t('No active text editor');
}

export function tSelectCodeSection(): string {
    return l10n.t('Please select a section of code');
}

export function tMissingApiKey(): string {
    return l10n.t('API Key is not configured. Open settings from the chat panel.');
}

export function tMissingApiUrl(): string {
    return l10n.t('API URL is not configured. Open settings from the chat panel.');
}

export function tMissingModel(): string {
    return l10n.t('Model is not configured. Open settings from the chat panel.');
}

export function tInsertCodeSuccess(): string {
    return l10n.t('Comments inserted into editor');
}

export function tInsertCodeFailed(): string {
    return l10n.t('Failed to insert code into editor');
}

export function tNoCodeToInsert(): string {
    return l10n.t('No code block found to insert');
}
