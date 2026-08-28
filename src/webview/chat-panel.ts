export type WebviewToExtensionMessage =
    | { type: 'ready' }
    | { type: 'load-settings' }
    | { type: 'save-settings'; settings: SettingsFormData }
    | { type: 'new-session' }
    | { type: 'switch-session'; sessionId: string }
    | { type: 'delete-session'; sessionId: string }
    | { type: 'insert-code'; code: string }
    | { type: 'user-input'; value: string }
    | { type: 'clear-chat' };

export type SessionListItem = {
    id: string;
    title: string;
    time: string;
    isActive: boolean;
};

export type SessionMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

export type UiStringsMap = Record<string, string>;

export type SettingsFormData = {
    apiUrl: string;
    apiKey: string;
    model: string;
    autoTriggerCompletion: boolean;
    completionMaxTokens: number;
};

export type ExtensionToWebviewMessage =
    | { type: 'ui-strings'; strings: UiStringsMap }
    | { type: 'sessions-data'; sessions: SessionListItem[] }
    | { type: 'load-session'; messages: SessionMessage[] }
    | { type: 'stream-start' }
    | { type: 'stream-chunk'; full: string }
    | { type: 'stream-end'; full: string; insertCode?: string }
    | { type: 'stream-error'; value: string }
    | { type: 'add-message'; value: string; isError?: boolean }
    | { type: 'add-user-message'; value: string }
    | { type: 'settings-data'; settings: SettingsFormData; hasApiKey: boolean }
    | { type: 'settings-saved'; success: boolean; message?: string };

export function getChatPanelHtml(): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        html, body {
            height: 100%;
            overflow: hidden;
        }

        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size, 13px);
            background: var(--vscode-sideBar-background);
            color: var(--vscode-sideBar-foreground);
        }

        .app {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }

        /* Header */
        .header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 14px;
            border-bottom: 1px solid var(--vscode-widget-border, rgba(128,128,128,0.2));
            background: var(--vscode-sideBar-background);
            flex-shrink: 0;
        }

        .header-icon {
            width: 22px;
            height: 22px;
            color: var(--vscode-textLink-foreground, #3794ff);
            flex-shrink: 0;
        }

        .header-text {
            flex: 1;
            min-width: 0;
        }

        .header-text h1 {
            font-size: 13px;
            font-weight: 600;
            line-height: 1.3;
            color: var(--vscode-sideBarTitle-foreground, var(--vscode-sideBar-foreground));
        }

        .header-text p {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 1px;
        }

        .header-actions {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            gap: 2px;
        }

        .icon-btn {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            padding: 0;
            border: none;
            border-radius: 6px;
            background: transparent;
            color: var(--vscode-icon-foreground, var(--vscode-foreground));
            cursor: pointer;
            transition: background 0.15s;
        }

        .icon-btn:hover {
            background: var(--vscode-toolbar-hoverBackground, rgba(128,128,128,0.2));
        }

        .icon-btn svg {
            width: 16px;
            height: 16px;
        }

        .icon-btn .badge-dot {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--vscode-inputValidation-warningBorder, #cca700);
            border: 1px solid var(--vscode-sideBar-background);
        }

        .icon-btn .badge-dot.hidden {
            display: none;
        }

        /* Settings overlay */
        .settings-overlay {
            position: fixed;
            inset: 0;
            z-index: 100;
            display: flex;
            align-items: stretch;
            justify-content: center;
            background: rgba(0, 0, 0, 0.45);
            animation: fadeIn 0.15s ease;
        }

        .settings-overlay.hidden {
            display: none;
        }

        .settings-panel {
            display: flex;
            flex-direction: column;
            width: 100%;
            max-height: 100%;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        }

        .settings-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px;
            border-bottom: 1px solid var(--vscode-widget-border, rgba(128,128,128,0.2));
        }

        .settings-header h2 {
            font-size: 14px;
            font-weight: 600;
        }

        .settings-body {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .field label {
            display: block;
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 6px;
            color: var(--vscode-foreground);
        }

        .field .desc {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
            line-height: 1.4;
        }

        .field input[type="text"],
        .field input[type="password"],
        .field input[type="number"] {
            width: 100%;
            padding: 8px 10px;
            border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3));
            border-radius: 6px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: var(--vscode-font-family);
            font-size: 13px;
            outline: none;
        }

        .field input:focus {
            border-color: var(--vscode-focusBorder, #007fd4);
            outline: 1px solid var(--vscode-focusBorder, #007fd4);
            outline-offset: -1px;
        }

        .field-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .field-row label {
            margin-bottom: 0;
        }

        .toggle {
            width: 36px;
            height: 20px;
            accent-color: var(--vscode-button-background);
            cursor: pointer;
        }

        .settings-footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 12px 16px;
            border-top: 1px solid var(--vscode-widget-border, rgba(128,128,128,0.2));
        }

        .settings-status {
            font-size: 11px;
            padding: 8px 10px;
            border-radius: 6px;
            display: none;
        }

        .settings-status.show {
            display: block;
        }

        .settings-status.success {
            background: var(--vscode-testing-iconPassed, rgba(115,201,145,0.15));
            color: var(--vscode-testing-iconPassed, #73c991);
        }

        .settings-status.error {
            background: var(--vscode-inputValidation-errorBackground, rgba(244,76,76,0.12));
            color: var(--vscode-errorForeground, #f14c4c);
        }

        /* Session drawer */
        .session-overlay {
            position: fixed;
            inset: 0;
            z-index: 90;
            display: flex;
            flex-direction: column;
            background: var(--vscode-sideBar-background);
            animation: fadeIn 0.15s ease;
        }

        .session-overlay.hidden {
            display: none;
        }

        .session-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 14px;
            border-bottom: 1px solid var(--vscode-widget-border, rgba(128,128,128,0.2));
        }

        .session-header h2 {
            font-size: 13px;
            font-weight: 600;
        }

        .session-list {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
        }

        .session-empty {
            padding: 24px 16px;
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }

        .session-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px;
            margin-bottom: 6px;
            border-radius: 8px;
            border: 1px solid transparent;
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s;
        }

        .session-item:hover {
            background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.12));
        }

        .session-item.active {
            background: var(--vscode-list-activeSelectionBackground, rgba(128,128,128,0.18));
            border-color: var(--vscode-focusBorder, #007fd4);
        }

        .session-item-body {
            flex: 1;
            min-width: 0;
        }

        .session-item-title {
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .session-item-time {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            margin-top: 2px;
        }

        .session-delete {
            width: 24px;
            height: 24px;
            padding: 0;
            border: none;
            border-radius: 4px;
            background: transparent;
            color: var(--vscode-descriptionForeground);
            cursor: pointer;
            flex-shrink: 0;
        }

        .session-delete:hover {
            background: var(--vscode-inputValidation-errorBackground, rgba(244,76,76,0.15));
            color: var(--vscode-errorForeground, #f14c4c);
        }

        /* Chat area */
        .chat-area {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
            scroll-behavior: smooth;
        }

        .chat-area::-webkit-scrollbar {
            width: 6px;
        }

        .chat-area::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbarSlider-background, rgba(128,128,128,0.4));
            border-radius: 3px;
        }

        .chat-area::-webkit-scrollbar-thumb:hover {
            background: var(--vscode-scrollbarSlider-hoverBackground, rgba(128,128,128,0.6));
        }

        /* Welcome */
        .welcome {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 24px 16px;
            min-height: 180px;
            gap: 12px;
        }

        .welcome.hidden {
            display: none;
        }

        .welcome-icon {
            width: 40px;
            height: 40px;
            color: var(--vscode-textLink-foreground, #3794ff);
            opacity: 0.85;
        }

        .welcome h2 {
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }

        .welcome p {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            line-height: 1.6;
            max-width: 260px;
        }

        .tips {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-top: 4px;
            width: 100%;
            max-width: 280px;
        }

        .tip {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 7px 10px;
            border-radius: 6px;
            background: var(--vscode-editor-inactiveSelectionBackground, rgba(128,128,128,0.1));
            border: 1px solid var(--vscode-widget-border, rgba(128,128,128,0.15));
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            text-align: left;
        }

        .tip kbd {
            font-family: var(--vscode-editor-font-family, monospace);
            font-size: 10px;
            padding: 1px 5px;
            border-radius: 3px;
            background: var(--vscode-badge-background, rgba(128,128,128,0.2));
            color: var(--vscode-badge-foreground, inherit);
            border: 1px solid var(--vscode-widget-border, rgba(128,128,128,0.2));
            flex-shrink: 0;
        }

        /* Messages */
        .messages {
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .message-row {
            display: flex;
            gap: 8px;
            animation: fadeIn 0.2s ease;
        }

        .message-row.user {
            flex-direction: row-reverse;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .avatar {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 11px;
            font-weight: 600;
        }

        .avatar.user {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .avatar.ai {
            background: var(--vscode-textLink-foreground, #3794ff);
            color: #fff;
        }

        .avatar.error {
            background: var(--vscode-inputValidation-errorBorder, #f14c4c);
            color: #fff;
        }

        .bubble-wrap {
            max-width: calc(100% - 32px);
            min-width: 0;
        }

        .bubble-label {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 4px;
            padding: 0 2px;
        }

        .message-row.user .bubble-label {
            text-align: right;
        }

        .bubble {
            padding: 10px 12px;
            border-radius: 10px;
            font-size: 13px;
            line-height: 1.55;
            word-break: break-word;
        }

        .bubble.user {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-bottom-right-radius: 3px;
        }

        .bubble.ai {
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            border: 1px solid var(--vscode-widget-border, rgba(128,128,128,0.2));
            border-bottom-left-radius: 3px;
        }

        .bubble.streaming {
            white-space: pre-wrap;
            word-break: break-word;
        }

        .bubble.streaming::after {
            content: '▋';
            display: inline-block;
            margin-left: 2px;
            color: var(--vscode-textLink-foreground, #3794ff);
            animation: blink 1s step-end infinite;
        }

        @keyframes blink {
            50% { opacity: 0; }
        }

        .bubble.error {
            background: var(--vscode-inputValidation-errorBackground, rgba(244,76,76,0.12));
            color: var(--vscode-errorForeground, #f14c4c);
            border: 1px solid var(--vscode-inputValidation-errorBorder, #f14c4c);
            border-bottom-left-radius: 3px;
        }

        .bubble p {
            margin: 0 0 8px;
        }

        .bubble p:last-child {
            margin-bottom: 0;
        }

        .code-block {
            margin: 8px 0;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid var(--vscode-widget-border, rgba(128,128,128,0.25));
        }

        .code-block:first-child {
            margin-top: 0;
        }

        .code-block:last-child {
            margin-bottom: 0;
        }

        .code-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 10px;
            background: var(--vscode-editor-inactiveSelectionBackground, rgba(128,128,128,0.15));
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            font-family: var(--vscode-editor-font-family, monospace);
        }

        .code-body {
            padding: 10px 12px;
            overflow-x: auto;
            font-family: var(--vscode-editor-font-family, monospace);
            font-size: 12px;
            line-height: 1.45;
            background: var(--vscode-textCodeBlock-background, var(--vscode-editor-background));
            color: var(--vscode-editor-foreground);
            white-space: pre;
        }

        /* Loading */
        .loading-row {
            display: flex;
            gap: 8px;
            animation: fadeIn 0.2s ease;
        }

        .typing-indicator {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 12px 14px;
            border-radius: 10px;
            border-bottom-left-radius: 3px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border, rgba(128,128,128,0.2));
        }

        .typing-indicator span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--vscode-descriptionForeground);
            animation: bounce 1.2s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(2) { animation-delay: 0.15s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.3s; }

        @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-5px); opacity: 1; }
        }

        /* Input */
        .input-area {
            flex-shrink: 0;
            padding: 10px 12px 12px;
            border-top: 1px solid var(--vscode-widget-border, rgba(128,128,128,0.2));
            background: var(--vscode-sideBar-background);
        }

        .input-box {
            position: relative;
            border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3));
            border-radius: 8px;
            background: var(--vscode-input-background);
            transition: border-color 0.15s;
        }

        .input-box:focus-within {
            border-color: var(--vscode-focusBorder, #007fd4);
            outline: 1px solid var(--vscode-focusBorder, #007fd4);
            outline-offset: -1px;
        }

        textarea {
            display: block;
            width: 100%;
            min-height: 72px;
            max-height: 160px;
            padding: 10px 12px 4px;
            border: none;
            background: transparent;
            color: var(--vscode-input-foreground);
            font-family: var(--vscode-font-family);
            font-size: 13px;
            line-height: 1.5;
            resize: none;
            outline: none;
        }

        textarea::placeholder {
            color: var(--vscode-input-placeholderForeground, var(--vscode-descriptionForeground));
        }

        .toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 8px 8px;
        }

        .hint {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
        }

        .actions {
            display: flex;
            gap: 6px;
        }

        button {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 5px 12px;
            border: none;
            border-radius: 5px;
            font-family: var(--vscode-font-family);
            font-size: 12px;
            cursor: pointer;
            transition: background 0.15s, opacity 0.15s;
        }

        button svg {
            width: 14px;
            height: 14px;
        }

        .btn-secondary {
            background: var(--vscode-button-secondaryBackground, rgba(128,128,128,0.2));
            color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
        }

        .btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground, rgba(128,128,128,0.3));
        }

        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .btn-primary:hover:not(:disabled) {
            background: var(--vscode-button-hoverBackground);
        }

        button:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }

        .message-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 8px;
        }

        .btn-insert {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border: 1px solid var(--vscode-button-border, transparent);
            border-radius: 5px;
            background: var(--vscode-button-secondaryBackground, rgba(128,128,128,0.2));
            color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
            font-family: var(--vscode-font-family);
            font-size: 11px;
            cursor: pointer;
        }

        .btn-insert:hover {
            background: var(--vscode-button-secondaryHoverBackground, rgba(128,128,128,0.3));
        }

        .btn-insert:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="app">
        <header class="header">
            <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
                <path d="M5 17l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z"/>
            </svg>
            <div class="header-text">
                <h1 id="txt-app-title">Web-VSCode AI</h1>
                <p id="txt-app-subtitle">Code assistant · Chat · Completion</p>
            </div>
            <div class="header-actions">
                <button class="icon-btn" id="history-btn" title="History">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
                </button>
                <button class="icon-btn" id="new-session-btn" title="New Chat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                </button>
                <button class="icon-btn" id="settings-btn" title="Settings">
                    <span class="badge-dot hidden" id="settings-badge"></span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                    </svg>
                </button>
            </div>
        </header>

        <main class="chat-area" id="chat-area">
            <div class="welcome" id="welcome">
                <svg class="welcome-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <h2 id="txt-welcome-title">How can I help you?</h2>
                <p id="txt-welcome-desc">Ask code questions, or select code in the editor and use the context menu</p>
                <div class="tips">
                    <div class="tip"><kbd>Enter</kbd> <span id="txt-tip-enter">Send message</span></div>
                    <div class="tip"><kbd>Shift+Enter</kbd> <span id="txt-tip-shift">New line</span></div>
                    <div class="tip" id="txt-tip-context">Context menu · Explain / Use case / Comment / Test / Fix</div>
                </div>
            </div>
            <div class="messages" id="messages"></div>
        </main>

        <footer class="input-area">
            <div class="input-box">
                <textarea id="user-input" rows="3" placeholder="Enter a question or code instruction..."></textarea>
                <div class="toolbar">
                    <span class="hint" id="txt-input-hint">Enter to send · Shift+Enter for new line</span>
                    <div class="actions">
                        <button class="btn-secondary" id="clear-btn" title="Clear">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                            <span id="txt-btn-clear">Clear</span>
                        </button>
                        <button class="btn-primary" id="send-btn" title="Send">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                            <span id="txt-btn-send">Send</span>
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    </div>

    <div class="session-overlay hidden" id="session-overlay">
        <div class="session-header">
            <h2 id="txt-session-history">Chat History</h2>
            <button class="icon-btn" id="session-close" title="Back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="session-list" id="session-list"></div>
    </div>

    <div class="settings-overlay hidden" id="settings-overlay">
        <div class="settings-panel">
            <div class="settings-header">
                <h2 id="txt-settings-title">Extension Settings</h2>
                <button class="icon-btn" id="settings-close" title="关闭">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="settings-body">
                <div class="settings-status" id="settings-status"></div>
                <div class="field">
                    <label for="cfg-api-key" id="txt-settings-api-key">API Key</label>
                    <input type="password" id="cfg-api-key" placeholder="sk-..." autocomplete="off" />
                    <p class="desc" id="txt-settings-api-key-desc">API key for DeepSeek or another OpenAI-compatible service</p>
                </div>
                <div class="field">
                    <label for="cfg-api-url" id="txt-settings-api-url">API URL</label>
                    <input type="text" id="cfg-api-url" placeholder="https://api.deepseek.com/v1" />
                </div>
                <div class="field">
                    <label for="cfg-model" id="txt-settings-model">Model</label>
                    <input type="text" id="cfg-model" placeholder="deepseek-chat" />
                </div>
                <div class="field field-row">
                    <label for="cfg-auto-completion" id="txt-settings-auto">Auto code completion</label>
                    <input type="checkbox" class="toggle" id="cfg-auto-completion" />
                </div>
                <div class="field">
                    <label for="cfg-max-tokens" id="txt-settings-max-tokens">Completion max tokens</label>
                    <input type="number" id="cfg-max-tokens" min="32" max="4096" step="32" />
                </div>
            </div>
            <div class="settings-footer">
                <button class="btn-secondary" id="settings-cancel"><span id="txt-settings-cancel">Cancel</span></button>
                <button class="btn-primary" id="settings-save"><span id="txt-settings-save">Save</span></button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const chatArea = document.getElementById('chat-area');
        const welcome = document.getElementById('welcome');
        const messages = document.getElementById('messages');
        const input = document.getElementById('user-input');
        const sendBtn = document.getElementById('send-btn');
        const clearBtn = document.getElementById('clear-btn');
        const settingsBtn = document.getElementById('settings-btn');
        const settingsBadge = document.getElementById('settings-badge');
        const settingsOverlay = document.getElementById('settings-overlay');
        const settingsClose = document.getElementById('settings-close');
        const settingsCancel = document.getElementById('settings-cancel');
        const settingsSave = document.getElementById('settings-save');
        const settingsStatus = document.getElementById('settings-status');
        const cfgApiKey = document.getElementById('cfg-api-key');
        const cfgApiUrl = document.getElementById('cfg-api-url');
        const cfgModel = document.getElementById('cfg-model');
        const cfgAutoCompletion = document.getElementById('cfg-auto-completion');
        const cfgMaxTokens = document.getElementById('cfg-max-tokens');
        const historyBtn = document.getElementById('history-btn');
        const newSessionBtn = document.getElementById('new-session-btn');
        const sessionOverlay = document.getElementById('session-overlay');
        const sessionClose = document.getElementById('session-close');
        const sessionList = document.getElementById('session-list');

        let streamingBubble = null;
        let uiStrings = {};

        vscode.postMessage({ type: 'ready' });

        window.addEventListener('message', event => {
            const msg = event.data;
            switch (msg.type) {
                case 'ui-strings':
                    uiStrings = msg.strings || {};
                    applyUiStrings();
                    break;
                case 'sessions-data':
                    renderSessionList(msg.sessions || []);
                    break;
                case 'load-session':
                    renderSessionMessages(msg.messages || []);
                    break;
                case 'settings-data':
                    fillSettingsForm(msg.settings);
                    updateSettingsBadge(msg.hasApiKey);
                    break;
                case 'settings-saved':
                    showSettingsStatus(msg.success, msg.success ? (uiStrings.settingsSaved || 'Settings saved') : (msg.message || uiStrings.settingsSaveFailed || 'Failed to save'));
                    if (msg.success) {
                        setTimeout(closeSettings, 600);
                    }
                    break;
                case 'stream-start':
                    hideWelcome();
                    hideLoader();
                    sendBtn.disabled = true;
                    streamingBubble = createStreamingBubble();
                    scrollToBottom();
                    break;
                case 'stream-chunk':
                    if (streamingBubble) {
                        streamingBubble.textContent = msg.full;
                        scrollToBottom();
                    }
                    break;
                case 'stream-end':
                    if (streamingBubble) {
                        finalizeStreamingBubble(streamingBubble, msg.full, msg.insertCode);
                        streamingBubble = null;
                    }
                    sendBtn.disabled = false;
                    scrollToBottom();
                    break;
                case 'stream-error':
                    removeStreamingBubble();
                    addMessage(msg.value, 'ai', true);
                    sendBtn.disabled = false;
                    scrollToBottom();
                    break;
                case 'add-message':
                    hideLoader();
                    addMessage(msg.value, 'ai', msg.isError);
                    sendBtn.disabled = false;
                    break;
                case 'add-user-message':
                    addMessage(msg.value, 'user');
                    break;
            }
        });

        function applyUiStrings() {
            const setText = (id, key) => {
                const el = document.getElementById(id);
                if (el && uiStrings[key]) el.textContent = uiStrings[key];
            };
            setText('txt-app-title', 'appTitle');
            setText('txt-app-subtitle', 'appSubtitle');
            setText('txt-welcome-title', 'welcomeTitle');
            setText('txt-welcome-desc', 'welcomeDesc');
            setText('txt-tip-enter', 'tipEnter');
            setText('txt-tip-shift', 'tipShiftEnter');
            setText('txt-tip-context', 'tipContextMenu');
            setText('txt-input-hint', 'inputHint');
            setText('txt-btn-clear', 'btnClear');
            setText('txt-btn-send', 'btnSend');
            setText('txt-session-history', 'sessionHistory');
            setText('txt-settings-title', 'settingsTitle');
            setText('txt-settings-api-key', 'settingsApiKey');
            setText('txt-settings-api-key-desc', 'settingsApiKeyDesc');
            setText('txt-settings-api-url', 'settingsApiUrl');
            setText('txt-settings-model', 'settingsModel');
            setText('txt-settings-auto', 'settingsAutoCompletion');
            setText('txt-settings-max-tokens', 'settingsMaxTokens');
            setText('txt-settings-cancel', 'settingsCancel');
            setText('txt-settings-save', 'settingsSave');
            if (uiStrings.inputPlaceholder) input.placeholder = uiStrings.inputPlaceholder;
            if (uiStrings.btnHistory) historyBtn.title = uiStrings.btnHistory;
            if (uiStrings.btnNewSession) newSessionBtn.title = uiStrings.btnNewSession;
            if (uiStrings.btnSettings) settingsBtn.title = uiStrings.btnSettings;
            if (uiStrings.btnClear) clearBtn.title = uiStrings.btnClear;
            if (uiStrings.btnSend) sendBtn.title = uiStrings.btnSend;
            if (uiStrings.btnBack) sessionClose.title = uiStrings.btnBack;
        }

        function formatSessionTime(iso) {
            try {
                return new Date(iso).toLocaleString();
            } catch {
                return iso;
            }
        }

        function renderSessionList(sessions) {
            sessionList.innerHTML = '';
            if (!sessions.length) {
                const empty = document.createElement('div');
                empty.className = 'session-empty';
                empty.textContent = uiStrings.sessionNoSessions || 'No saved conversations';
                sessionList.appendChild(empty);
                return;
            }

            sessions.forEach(session => {
                const item = document.createElement('div');
                item.className = 'session-item' + (session.isActive ? ' active' : '');
                item.innerHTML = \`
                    <div class="session-item-body">
                        <div class="session-item-title"></div>
                        <div class="session-item-time"></div>
                    </div>
                    <button class="session-delete" title="\${uiStrings.btnDelete || 'Delete'}">×</button>\`;
                item.querySelector('.session-item-title').textContent = session.title;
                item.querySelector('.session-item-time').textContent = formatSessionTime(session.time);
                item.addEventListener('click', () => {
                    vscode.postMessage({ type: 'switch-session', sessionId: session.id });
                    closeSessionPanel();
                });
                item.querySelector('.session-delete').addEventListener('click', e => {
                    e.stopPropagation();
                    vscode.postMessage({ type: 'delete-session', sessionId: session.id });
                });
                sessionList.appendChild(item);
            });
        }

        function renderSessionMessages(sessionMessages) {
            removeStreamingBubble();
            messages.innerHTML = '';
            if (!sessionMessages.length) {
                welcome.classList.remove('hidden');
                return;
            }
            welcome.classList.add('hidden');
            sessionMessages.forEach(message => {
                if (message.role === 'user' || message.role === 'assistant') {
                    addMessage(message.content, message.role === 'user' ? 'user' : 'ai');
                }
            });
            scrollToBottom();
        }

        function openSessionPanel() {
            sessionOverlay.classList.remove('hidden');
        }

        function closeSessionPanel() {
            sessionOverlay.classList.add('hidden');
        }

        function openSettings() {
            settingsOverlay.classList.remove('hidden');
            hideSettingsStatus();
            vscode.postMessage({ type: 'load-settings' });
        }

        function closeSettings() {
            settingsOverlay.classList.add('hidden');
            hideSettingsStatus();
        }

        function fillSettingsForm(settings) {
            cfgApiKey.value = settings.apiKey || '';
            cfgApiUrl.value = settings.apiUrl || '';
            cfgModel.value = settings.model || '';
            cfgAutoCompletion.checked = settings.autoTriggerCompletion !== false;
            cfgMaxTokens.value = settings.completionMaxTokens || 256;
        }

        function updateSettingsBadge(hasApiKey) {
            settingsBadge.classList.toggle('hidden', hasApiKey);
        }

        function showSettingsStatus(success, text) {
            settingsStatus.textContent = text;
            settingsStatus.className = 'settings-status show ' + (success ? 'success' : 'error');
        }

        function hideSettingsStatus() {
            settingsStatus.className = 'settings-status';
            settingsStatus.textContent = '';
        }

        function collectSettingsForm() {
            return {
                apiKey: cfgApiKey.value.trim(),
                apiUrl: cfgApiUrl.value.trim(),
                model: cfgModel.value.trim(),
                autoTriggerCompletion: cfgAutoCompletion.checked,
                completionMaxTokens: parseInt(cfgMaxTokens.value, 10) || 256,
            };
        }

        settingsBtn.addEventListener('click', openSettings);
        historyBtn.addEventListener('click', openSessionPanel);
        newSessionBtn.addEventListener('click', () => vscode.postMessage({ type: 'new-session' }));
        sessionClose.addEventListener('click', closeSessionPanel);
        settingsClose.addEventListener('click', closeSettings);
        settingsCancel.addEventListener('click', closeSettings);
        settingsOverlay.addEventListener('click', e => {
            if (e.target === settingsOverlay) closeSettings();
        });
        settingsSave.addEventListener('click', () => {
            vscode.postMessage({ type: 'save-settings', settings: collectSettingsForm() });
        });

        function hideWelcome() {
            welcome.classList.add('hidden');
        }

        function scrollToBottom() {
            chatArea.scrollTop = chatArea.scrollHeight;
        }

        function showLoader() {
            hideWelcome();
            hideLoader();
            const row = document.createElement('div');
            row.className = 'loading-row';
            row.id = 'loader';
            row.innerHTML = \`
                <div class="avatar ai">AI</div>
                <div class="bubble-wrap">
                    <div class="bubble-label">Web-VSCode</div>
                    <div class="typing-indicator">
                        <span></span><span></span><span></span>
                    </div>
                </div>\`;
            messages.appendChild(row);
            scrollToBottom();
        }

        function hideLoader() {
            document.getElementById('loader')?.remove();
        }

        function createStreamingBubble() {
            removeStreamingBubble();
            const row = document.createElement('div');
            row.className = 'message-row ai';
            row.id = 'streaming-row';
            row.innerHTML = \`
                <div class="avatar ai">AI</div>
                <div class="bubble-wrap">
                    <div class="bubble-label">\${uiStrings.labelAi || 'Web-VSCode'}</div>
                    <div class="bubble ai streaming"></div>
                </div>\`;
            messages.appendChild(row);
            return row.querySelector('.bubble');
        }

        function removeStreamingBubble() {
            streamingBubble = null;
            document.getElementById('streaming-row')?.remove();
        }

        function finalizeStreamingBubble(bubble, text, insertCode) {
            bubble.classList.remove('streaming');
            renderContent(bubble, text || bubble.textContent || '');
            document.getElementById('streaming-row')?.removeAttribute('id');

            if (insertCode) {
                appendInsertButton(bubble, insertCode);
            }
        }

        function appendInsertButton(bubble, code) {
            const wrap = bubble.closest('.bubble-wrap');
            if (!wrap || wrap.querySelector('.btn-insert')) {
                return;
            }

            const actions = document.createElement('div');
            actions.className = 'message-actions';

            const btn = document.createElement('button');
            btn.className = 'btn-insert';
            btn.textContent = uiStrings.btnInsertCode || 'Insert into editor';
            btn.addEventListener('click', () => {
                btn.disabled = true;
                vscode.postMessage({ type: 'insert-code', code });
            });

            actions.appendChild(btn);
            wrap.appendChild(actions);
        }

        function addMessage(text, role, isError) {
            hideWelcome();
            hideLoader();

            const isErrorMsg = isError || (role === 'ai' && text.startsWith('Error:'));
            const row = document.createElement('div');
            row.className = 'message-row ' + role;

            const avatarLabel = role === 'user' ? (uiStrings.labelYou || 'You').slice(0, 1) : (isErrorMsg ? '!' : 'AI');
            const avatarClass = role === 'user' ? 'user' : (isErrorMsg ? 'error' : 'ai');
            const labelText = role === 'user' ? (uiStrings.labelYou || 'You') : (isErrorMsg ? (uiStrings.labelError || 'Error') : (uiStrings.labelAi || 'Web-VSCode'));
            const bubbleClass = role === 'user' ? 'user' : (isErrorMsg ? 'error' : 'ai');

            row.innerHTML = \`
                <div class="avatar \${avatarClass}">\${avatarLabel}</div>
                <div class="bubble-wrap">
                    <div class="bubble-label">\${labelText}</div>
                    <div class="bubble \${bubbleClass}"></div>
                </div>\`;

            const bubble = row.querySelector('.bubble');
            renderContent(bubble, isErrorMsg ? text.replace(/^Error:\\s*/, '') : text);
            messages.appendChild(row);
            scrollToBottom();
        }

        function renderContent(container, text) {
            container.innerHTML = '';
            const codeBlockRegex = /\`\`\`(\\w*)\\n?([\\s\\S]*?)\`\`\`/g;
            let lastIndex = 0;
            let match;
            let hasCodeBlock = false;

            while ((match = codeBlockRegex.exec(text)) !== null) {
                hasCodeBlock = true;
                if (match.index > lastIndex) {
                    appendTextBlock(container, text.slice(lastIndex, match.index));
                }
                appendCodeBlock(container, match[1] || 'code', match[2].trimEnd());
                lastIndex = match.index + match[0].length;
            }

            if (!hasCodeBlock) {
                appendTextBlock(container, text);
            } else if (lastIndex < text.length) {
                appendTextBlock(container, text.slice(lastIndex));
            }
        }

        function appendTextBlock(container, text) {
            const trimmed = text.trim();
            if (!trimmed) return;

            const paragraphs = trimmed.split(/\\n{2,}/);
            paragraphs.forEach(p => {
                const el = document.createElement('p');
                el.textContent = p.trim();
                container.appendChild(el);
            });
        }

        function appendCodeBlock(container, lang, code) {
            const block = document.createElement('div');
            block.className = 'code-block';

            const header = document.createElement('div');
            header.className = 'code-header';
            header.textContent = lang;

            const body = document.createElement('pre');
            body.className = 'code-body';
            body.textContent = code;

            block.appendChild(header);
            block.appendChild(body);
            container.appendChild(block);
        }

        function sendMessage() {
            const val = input.value.trim();
            if (!val || sendBtn.disabled) return;
            addMessage(val, 'user');
            vscode.postMessage({ type: 'user-input', value: val });
            input.value = '';
            input.style.height = 'auto';
        }

        sendBtn.addEventListener('click', sendMessage);

        clearBtn.addEventListener('click', () => {
            messages.innerHTML = '';
            welcome.classList.remove('hidden');
            vscode.postMessage({ type: 'clear-chat' });
        });

        input.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 160) + 'px';
        });
    </script>
</body>
</html>`;
}
