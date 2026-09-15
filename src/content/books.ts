import type { AmazonMarketplace, Book, Volume } from "./types";

const AMAZON_HOSTS: Record<AmazonMarketplace, string> = {
  us: "https://www.amazon.com",
  uk: "https://www.amazon.co.uk",
  es: "https://www.amazon.es",
  de: "https://www.amazon.de",
  mx: "https://www.amazon.com.mx",
  br: "https://www.amazon.com.br",
};

export const MARKETPLACES = Object.keys(AMAZON_HOSTS) as AmazonMarketplace[];

/** Kindle product URL for a given ASIN in a given store. */
export function kindleLink(asin: string, market: AmazonMarketplace): string {
  return `${AMAZON_HOSTS[market]}/dp/${asin}`;
}

/**
 * The written work, displayed in the library.
 *
 * `color` is the spine colour on the shelf — the only way to tell one book
 * from another at map distance, so they are kept distinct rather than pretty.
 */
export const BOOKS: Book[] = [
  {
    id: "humanos-era-ia",
    title: "Humanos en la Era de la IA",
    color: "#b5563f",
    status: "in-progress",
  },
  {
    id: "master-claude-code",
    title: "Master Claude Code",
    color: "#c88a3a",
    status: "in-progress",
  },
  {
    id: "speak-software",
    title: "Speak Software",
    color: "#4f7a86",
    status: "in-progress",
  },
  {
    id: "the-ai-developer",
    title: "The AI Developer",
    color: "#5d6f9e",
    status: "in-progress",
  },
  {
    id: "ai-coding-workflows",
    title: "AI Coding Workflows",
    color: "#7c9155",
    status: "published",
  },
  {
    id: "developer-to-tpm",
    title: "From Developer to TPM",
    color: "#8a5a86",
    status: "published",
  },
];

/**
 * The "En 20 Minutos" collections — episodes gathered into volumes.
 *
 * Kept apart from `BOOKS` because they belong to the shows rather than to the
 * shelf: they live at the studio, next to the podcast they came from.
 */
export const VOLUMES: Volume[] = [
  {
    id: "historia-vol1",
    title: "History in 20 Minutes — Volume 1",
    show: "historia",
    volume: 1,
    cover: "/books/historia-en.jpg",
    asin: "B0GZBJMHLT",
  },
  {
    id: "filosofia-vol1",
    title: "Philosophy in 20 Minutes — Volume 1",
    show: "filosofia",
    volume: 1,
    cover: "/books/filosofia-en.jpg",
    asin: "B0H2BW31RP",
  },
  {
    id: "libros-vol1",
    title: "Books in 20 Minutes — Volume 1",
    show: "libros",
    volume: 1,
    cover: "/books/libros-en.jpg",
  },
  {
    id: "mitologia-vol1",
    title: "Mythology in 20 Minutes — Volume 1",
    show: "mitologia",
    volume: 1,
    cover: "/books/mitologia-en.jpg",
  },
];
