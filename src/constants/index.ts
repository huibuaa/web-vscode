export const EXTENSION_ID = 'WebName.web-vscode';

export const CHAT_VIEW_ID = 'web-vscode.chatView';

export const COMMANDS = {
    CHAT_FOCUS: 'web-vscode.chat.focus',
    EXPLAIN: 'web-vscode.explain',
    UNIT_TEST: 'web-vscode.unit-test',
    FIX_BUGS: 'web-vscode.fix-bugs',
    USE_CASE: 'web-vscode.use-case',
    GENERATE_COMMENT: 'web-vscode.generate-comment',
} as const;

export const EDITOR_ACTIONS = [
    { command: COMMANDS.EXPLAIN, action: 'explain' as const },
    { command: COMMANDS.USE_CASE, action: 'use-case' as const },
    { command: COMMANDS.GENERATE_COMMENT, action: 'generate-comment' as const },
    { command: COMMANDS.UNIT_TEST, action: 'unit-test' as const },
    { command: COMMANDS.FIX_BUGS, action: 'fix-bugs' as const },
] as const;

export type EditorActionType = (typeof EDITOR_ACTIONS)[number]['action'];

export const COMPLETION_SYSTEM_PROMPT =
    '你是一个代码补全助手。请根据用户提供的代码上下文进行续写。只返回续写的代码内容，不要解释，不要包含 Markdown 代码块标记（如 ```）。';

export const COMPLETION_STOP_WORDS = ['\n\n', '```'];

export const COMPLETION_CONTEXT_LINES = 20;

export const COMPLETION_TIMEOUT_MS = 5000;

export const CHAT_TIMEOUT_MS = 60000;
