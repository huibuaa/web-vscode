import axios, { isAxiosError } from 'axios';
import type { Readable } from 'stream';
import { getSettings, validateSettings } from '../config/settings';
import type { ChatCompletionOptions, StreamChunkHandler } from '../types/ai';

export class AiService {
    async chatCompletion(options: ChatCompletionOptions): Promise<string> {
        const settings = getSettings();
        const validationError = validateSettings(settings);
        if (validationError) {
            throw new Error(validationError);
        }

        const { apiUrl, apiKey, model } = settings;

        const response = await axios.post(
            `${apiUrl}/chat/completions`,
            {
                model,
                messages: options.messages,
                max_tokens: options.maxTokens,
                temperature: options.temperature,
                stop: options.stop,
                stream: false,
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: options.timeout ?? 60000,
            }
        );

        return response.data.choices[0]?.message?.content ?? '';
    }

    async chatCompletionStream(
        options: ChatCompletionOptions,
        onChunk: StreamChunkHandler
    ): Promise<string> {
        const settings = getSettings();
        const validationError = validateSettings(settings);
        if (validationError) {
            throw new Error(validationError);
        }

        const { apiUrl, apiKey, model } = settings;

        const response = await axios.post(
            `${apiUrl}/chat/completions`,
            {
                model,
                messages: options.messages,
                max_tokens: options.maxTokens,
                temperature: options.temperature,
                stop: options.stop,
                stream: true,
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                responseType: 'stream',
                timeout: options.timeout ?? 60000,
                validateStatus: () => true,
            }
        );

        if (response.status !== 200) {
            const errorBody = await readStreamToString(response.data as Readable);
            throw new Error(`接口错误 (${response.status}): ${errorBody}`);
        }

        return parseSseStream(response.data as Readable, onChunk);
    }

    formatError(error: unknown): string {
        if (isAxiosError(error)) {
            if (error.code === 'ECONNABORTED') {
                return '请求超时（AI生成长代码需要时间，请检查网络或增加超时时间）';
            }
            if (error.response) {
                const data = error.response.data;
                if (typeof data === 'string') {
                    return `接口错误 (${error.response.status}): ${data}`;
                }
                return `接口错误 (${error.response.status}): ${JSON.stringify(data)}`;
            }
            return error.message;
        }

        if (error instanceof Error) {
            return error.message;
        }

        return '未知错误';
    }
}

function readStreamToString(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = '';
        stream.on('data', (chunk: Buffer) => {
            data += chunk.toString();
        });
        stream.on('end', () => resolve(data));
        stream.on('error', reject);
    });
}

function parseSseStream(stream: Readable, onChunk: StreamChunkHandler): Promise<string> {
    return new Promise((resolve, reject) => {
        let buffer = '';
        let fullText = '';

        stream.on('data', (chunk: Buffer) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) {
                    continue;
                }

                const data = trimmed.slice(5).trim();
                if (!data || data === '[DONE]') {
                    continue;
                }

                try {
                    const parsed = JSON.parse(data) as {
                        choices?: Array<{ delta?: { content?: string } }>;
                    };
                    const delta = parsed.choices?.[0]?.delta?.content;
                    if (delta) {
                        fullText += delta;
                        onChunk(delta, fullText);
                    }
                } catch {
                    // 忽略不完整 JSON 行
                }
            }
        });

        stream.on('end', () => resolve(fullText));
        stream.on('error', reject);
    });
}
