import type { ExtensionContext } from 'vscode';
import type { ChatMessage } from '../types/ai';

export interface ChatSession {
    id: string;
    title: string;
    time: string;
    messages: ChatMessage[];
}

export class SessionStore {
    private readonly storeKey = 'web-vscode.sessions';

    constructor(private readonly extensionContext: ExtensionContext) {}

    getAll(): ChatSession[] {
        const stored = this.extensionContext.globalState.get<ChatSession[]>(this.storeKey) ?? [];
        return stored
            .filter(session => session.messages.length > 0)
            .sort((a, b) => (a.time < b.time ? 1 : -1));
    }

    getById(sessionId: string): ChatSession | undefined {
        return this.getAll().find(session => session.id === sessionId);
    }

    save(session: ChatSession): void {
        if (session.messages.length === 0) {
            this.delete(session.id);
            return;
        }

        const sessions = this.extensionContext.globalState.get<ChatSession[]>(this.storeKey) ?? [];
        const index = sessions.findIndex(item => item.id === session.id);

        if (index >= 0) {
            sessions[index] = session;
        } else {
            sessions.push(session);
        }

        void this.extensionContext.globalState.update(this.storeKey, sessions);
    }

    delete(sessionId: string): void {
        const sessions = (this.extensionContext.globalState.get<ChatSession[]>(this.storeKey) ?? [])
            .filter(session => session.id !== sessionId);
        void this.extensionContext.globalState.update(this.storeKey, sessions);
    }
}
