export function extractCodeBlock(text: string): string | undefined {
    const match = text.match(/```(?:[\w+-]*)?\n([\s\S]*?)```/);
    if (match?.[1]) {
        return match[1].replace(/\s+$/, '');
    }

    return undefined;
}
