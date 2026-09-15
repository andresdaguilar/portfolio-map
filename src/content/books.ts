import type { AmazonMarketplace, Book } from "./types";

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
 * Published volumes — collected episodes, one book per show.
 * Covers are copied from the podcast repo into `/public/books/`.
 * A volume with no `asin` is written but not yet on sale.
 */
export const BOOKS: Book[] = [
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
