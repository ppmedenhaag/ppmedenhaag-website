export function stripMarkdown(markdown: string): string {
    if (!markdown) return "";

    // Remove HTML tags
    let text = markdown.replace(/<[^>]*>/g, "");

    // Remove Markdown images
    text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "");

    // Remove Markdown links but keep text
    text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");

    // Remove Markdown headers
    text = text.replace(/#{1,6}\s+/g, "");

    // Remove Markdown bold/italic
    text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
    text = text.replace(/(\*|_)(.*?)\1/g, "$2");

    // Remove Markdown code blocks
    text = text.replace(/```[\s\S]*?```/g, "");
    text = text.replace(/`([^`]+)`/g, "$1");

    // Remove Markdown blockquotes
    text = text.replace(/^>\s+/gm, "");

    // Remove Markdown lists
    text = text.replace(/^[\s-]*[-+*]\s+/gm, "");
    text = text.replace(/^\s*\d+\.\s+/gm, "");

    // Remove Hugo shortcodes {{< ... >}}
    text = text.replace(/{{<[^>]*>}}/g, "");

    return text.trim();
}

export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
}
