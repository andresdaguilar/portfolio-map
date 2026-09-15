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
    id: "claude-code-mastery",
    title: "Claude Code Mastery",
    subtitle:
      "From beginner prompts to advanced coding workflows: a hands-on guide for modern developers",
    excerpt:
      "Most developers who try Claude Code give up before they see what it can actually do. Not because it is hard — because nobody showed them how it works. From the first install to fully autonomous agents: CLAUDE.md files, permission modes, MCP servers you build yourself, hooks and CI pipelines, and the guardrails autonomous systems need in production.",
    color: "#c88a3a",
    asin: "B0H6BQC6JR",
    format: "kindle",
  },
  {
    id: "ai-coding-workflows",
    title: "AI Coding Workflows",
    subtitle: "Building Production-Ready Software with AI",
    excerpt:
      "The most successful AI developers are not the ones who write the best prompts. They are the ones who build the best workflows. Not a collection of prompts and not a guide to any one tool — repeatable practice for planning, review, testing, debugging, context engineering and team adoption, the parts that compound while the tools keep changing.",
    color: "#7c9155",
    asin: "B0HHBXRNYP",
    format: "kindle",
  },
  {
    id: "the-ai-developer",
    title: "The AI Developer",
    subtitle: "A Practical Guide to Building with Large Language Models",
    excerpt:
      "For builders who want to move past prompting and ship reliable products with language models. Using them well takes more than better questions: it takes workflows, clearer context, stronger feedback loops, and the discipline to treat an intelligent system as an engineering partner rather than a party trick. Prompts are tactics. Workflows are strategy.",
    color: "#5d6f9e",
    asin: "B0HHBPK1B1",
    format: "kindle",
  },
  {
    id: "speak-software",
    title: "Speak Software",
    subtitle:
      "The Language, Jargon and Mental Models of Modern Software Engineering",
    excerpt:
      "Software teams do not just write code. They speak in abstractions — APIs, domains, deployments, dependencies, trade-offs, technical debt, observability — and that language shapes how engineers think. This turns the jargon into mental models you can actually use, and shows how the concepts connect instead of listing them as a glossary.",
    color: "#4f7a86",
    asin: "B0HHCC1P2Z",
    format: "kindle",
  },
  {
    id: "developer-to-tpm",
    title: "From Developer to Technical Project Manager",
    subtitle: "A Practical Guide to Becoming a Technical Project Manager",
    excerpt:
      "Developers end up running meetings, coordinating teams, managing stakeholders and making decisions that shape whole projects — and are almost never taught how to do any of it. Written from delivery in startups, consulting and enterprise: scope and risk, meetings and estimates, Agile and its hybrids, and keeping your technical edge while you lead. The move is not about writing less code. It is about creating more impact.",
    color: "#8a5a86",
    asin: "B0H6CC4RC5",
    format: "kindle",
  },
  {
    id: "humanos-era-ia",
    title: "Humanos en la era de la IA",
    subtitle:
      "Una mirada a la mente, la técnica y el sentido en la era de las máquinas pensantes",
    excerpt:
      "¿Qué queda de lo humano cuando las máquinas empiezan a pensar? Del fuego y la escritura a los modelos de lenguaje, un recorrido por cómo hemos ido externalizando la mente — primero en herramientas, después en máquinas, ahora en inteligencias artificiales. No es un libro técnico: es una invitación a pensar despacio en un mundo que piensa por nosotros.",
    color: "#b5563f",
    asin: "B0FZQ7SBKW",
    format: "paperback",
    language: "es",
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
