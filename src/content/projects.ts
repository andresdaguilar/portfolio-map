import type { Project } from "./types";

/**
 * Side projects and tools. One CRT monitor each in the workshop, every screen
 * looping a screenshot until the player walks up to it.
 */
export const PROJECTS: Project[] = [
  {
    id: "en20minutos",
    name: "En 20 Minutos — Production Desk",
    summary:
      "The rig behind six podcasts. Scans the episode tree on disk, tracks bilingual script/blog/audio state per episode, and drives ffmpeg to assemble intro + narration + outro at -16 LUFS, then renders the video from the cover art.",
    stack: ["Next.js", "TypeScript", "ffmpeg", "Node.js"],
    screen: "/screens/en20minutos.png",
  },
  {
    id: "hivensis",
    name: "Hivensis",
    summary:
      "A localization operations platform: orchestration, automation, and governance for multilingual content and the business processes wrapped around it.",
    stack: ["Next.js", "TypeScript", "PostgreSQL"],
    screen: "/screens/hivensis.png",
  },
  {
    id: "founderos",
    name: "FounderOS",
    summary:
      "A personal founder operating system — businesses, content, finances, and the daily agenda in one executive view. Built spec-first: the documentation came before the code.",
    stack: ["Next.js", "Prisma", "Neon", "Auth.js", "Google APIs"],
    screen: "/screens/founderos.png",
  },
  {
    id: "empresimple",
    name: "EmpreSimple",
    summary:
      "Productised web presence for small businesses in Argentina: orders, appointments, and reservations for a flat monthly fee.",
    stack: ["Next.js", "TypeScript", "Tailwind"],
    url: "https://empresimple.com.ar",
    screen: "/screens/empresimple.png",
  },
  {
    id: "william",
    name: "William",
    summary: "An online course school — catalogue, enrolment, and delivery.",
    stack: ["Next.js", "Neon", "Drizzle", "Auth.js", "Resend"],
    screen: "/screens/william.png",
  },
  {
    id: "latam-staffers",
    name: "Latam Staffers",
    summary:
      "Site and candidate pipeline for a LatAm technical staffing practice.",
    stack: ["Next.js", "Radix UI", "Tailwind"],
    screen: "/screens/latam-staffers.png",
  },
  {
    id: "biometricas",
    name: "Biométricas",
    summary:
      "Private daily body-metrics tracker — weight, visceral fat, muscle percentage, biological age — charted over time with historical highs and lows.",
    stack: ["Next.js", "Drizzle", "PostgreSQL"],
    screen: "/screens/biometricas.png",
  },
  {
    id: "blog-en20minutos",
    name: "En 20 Minutos — Blog",
    summary:
      "The public face of the podcasts: episode write-ups served from Contentful.",
    stack: ["Next.js", "Contentful", "TypeScript"],
    screen: "/screens/blog.png",
  },
  {
    id: "poker-planning",
    name: "Poker Planning Game",
    summary: "Real-time estimation rounds for distributed teams.",
    stack: ["Next.js", "TypeScript"],
    screen: "/screens/poker.png",
  },
];
