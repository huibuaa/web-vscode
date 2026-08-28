import { l10n, type ExtensionContext } from 'vscode';
import type { ChatMessage } from '../types/ai';
import { ChatSession, SessionStore } from './session-store';

const CURRENT_SESSION_KEY = 'web-vscode.currentSessionId';

export interface SessionSummary {
    id: string;
    title: string;
    time: string;
    isActive: boolean;
}

export class SessionManager {
    private readonly store: SessionStore;
    private currentSession: ChatSession;

    constructor(private readonly extensionContext: ExtensionContext) {
        this.store = new SessionStore(extensionContext);
        this.currentSession = this.restoreCurrentSession();
    }

    getCurrentSessionId(): string {
        return this.currentSession.id;
    }

    getMessages(): ChatMessage[] {
        return [...this.currentSession.messages];
    }

    getSessionSummaries(): SessionSummary[] {
        const currentId = this.currentSession.id;
        const summaries = this.store.getAll().map(session => ({
            id: session.id,
            title: session.title,
            time: session.time,
            isActive: session.id === currentId,
        }));

        if (!summaries.some(session => session.isActive) && this.currentSession.messages.length > 0) {
            summaries.unshift({
                id: this.currentSession.id,
                title: this.currentSession.title,
                time: this.currentSession.time,
                isActive: true,
            });
        }

        return summaries;
    }

    createSession(): ChatSession {
        this.currentSession = this.buildEmptySession();
        this.persistCurrentSessionId();
        return this.currentSession;
    }

    switchSession(sessionId: string): ChatSession | undefined {
        const session = this.store.getById(sessionId);
        if (!session) {
            return undefined;
        }

        this.currentSession = session;
        this.persistCurrentSessionId();
        return session;
    }

    deleteSession(sessionId: string): ChatSession {
        this.store.delete(sessionId);

        if (this.currentSession.id !== sessionId) {
            return this.currentSession;
        }

        const nextSession = this.store.getAll()[0];
        this.currentSession = nextSession ?? this.buildEmptySession();
        this.persistCurrentSessionId();
        return this.currentSession;
    }

    clearCurrentSession(): void {
        this.currentSession = {
            ...this.currentSession,
            messages: [],
            title: l10n.t('New Chat'),
        };
        this.store.delete(this.currentSession.id);
    }

    addUserMessage(content: string): void {
        this.currentSession.messages.push({ role: 'user', content });
        this.updateTitle(content);
        this.store.save(this.currentSession);
    }

    addAssistantMessage(content: string): void {
        this.currentSession.messages.push({ role: 'assistant', content });
        this.store.save(this.currentSession);
    }

    removeLastMessage(): void {
        this.currentSession.messages.pop();
        if (this.currentSession.messages.length === 0) {
            this.store.delete(this.currentSession.id);
            return;
        }
        this.store.save(this.currentSession);
    }

    private restoreCurrentSession(): ChatSession {
        const savedId = this.extensionContext.globalState.get<string>(CURRENT_SESSION_KEY);
        if (savedId) {
            const savedSession = this.store.getById(savedId);
            if (savedSession) {
                return savedSession;
            }
        }

        const latestSession = this.store.getAll()[0];
        if (latestSession) {
            return latestSession;
        }

        return this.buildEmptySession();
    }

    private buildEmptySession(): ChatSession {
        return {
            id: new Date().toISOString(),
            title: l10n.t('New Chat'),
            time: new Date().toISOString(),
            messages: [],
        };
    }

    private updateTitle(firstUserMessage: string): void {
        if (this.currentSession.messages.filter(message => message.role === 'user').length === 1) {
            const normalized = firstUserMessage.replace(/\s+/g, ' ').trim();
            this.currentSession.title = normalized.slice(0, 40) || l10n.t('New Chat');
            this.currentSession.time = new Date().toISOString();
        }
    }

    private persistCurrentSessionId(): void {
        void this.extensionContext.globalState.update(CURRENT_SESSION_KEY, this.currentSession.id);
    }
}
