import { deriveFromBody } from "./seo";

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

/** Cut at a word boundary (never mid-word) and add "…". */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    const slice = text.slice(0, maxLength);
    const space = slice.lastIndexOf(" ");
    return `${slice.slice(0, space > maxLength * 0.6 ? space : maxLength).replace(/[\s,;:–—-]+$/, "")}…`;
}

/**
 * Card teaser from a Markdown body (when there is no front matter `description`): skips greetings
 * ("Bismillah… Assalamu'alaikum…"), headings and tables, and ends at a sentence or word boundary.
 */
export function cardExcerpt(body: string | undefined, max = 160): string {
    return deriveFromBody(body, max) || truncateText(stripMarkdown(body ?? ""), max);
}
