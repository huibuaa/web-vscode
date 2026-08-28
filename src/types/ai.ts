export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
    role: ChatRole;
    content: string;
}

export interface ChatCompletionOptions {
    messages: ChatMessage[];
    maxTokens?: number;
    temperature?: number;
    stop?: string[];
    timeout?: number;
}

export type StreamChunkHandler = (delta: string, fullText: string) => void;
