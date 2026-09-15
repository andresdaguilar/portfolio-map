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
    archived: true,
  },
  {
    id: "atsio",
    name: "ATSio",
    summary:
      "A personal applicant tracking system: every application, stage and follow-up in one place, instead of a spreadsheet and a memory.",
    stack: ["Next.js", "Prisma", "PostgreSQL", "NextAuth", "Supabase Storage", "shadcn/ui"],
    url: "https://atsio.app",
    logo: "/logos/atsio.png",
    screen: "/screens/atsio.png",
  },
  {
    id: "organis",
    name: "Organis",
    summary:
      "Work management that stops at one tab: issues, a wiki, boards and a time tracker in a single app — the job Jira, Confluence, Asana and a timesheet tool currently do between them, minus the four-way context switch.",
    stack: ["Next.js", "TipTap", "dnd-kit", "PostgreSQL"],
    wip: true,
    screen: "/screens/organis.png",
  },
  {
    id: "hivensis",
    name: "Hivensis",
    summary:
      "A localization operations platform: orchestration, automation, and governance for multilingual content and the business processes wrapped around it.",
    stack: ["Next.js", "TypeScript", "PostgreSQL"],
    screen: "/screens/hivensis.png",
    archived: true,
  },
  {
    id: "founderos",
    name: "FounderOS",
    summary:
      "A personal founder operating system — businesses, content, finances, and the daily agenda in one executive view. Built spec-first: the documentation came before the code.",
    stack: ["Next.js", "Prisma", "Neon", "Auth.js", "Google APIs"],
    screen: "/screens/founderos.png",
    archived: true,
  },
  {
    id: "nutriciondesk",
    name: "NutricionDesk",
    summary:
      "SaaS for independent Spanish-speaking nutritionists: scheduling, patient records, and clinical history in one place, plus a patient portal for booking, file uploads, and progress. Freemium, so a practice can start at zero and move to Pro when volume justifies it.",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Drizzle"],
    url: "https://www.nutriciondesk.com",
    logo: "/logos/nutriciondesk.png",
    screen: "/screens/nutriciondesk.png",
  },
  {
    id: "racemode",
    name: "RaceMode",
    summary:
      "A career-acceleration program for LatAm engineers going after international roles — the frameworks, the mindset, and the interview itself. Written and produced end to end: curriculum, scripts, recording, and the site it ships on.",
    stack: ["Course design", "Video production", "Vercel"],
    url: "https://www.racemode.dev",
    logo: "/logos/racemode.png",
    screen: "/screens/racemode.png",
  },
  {
    id: "empresimple",
    name: "EmpreSimple",
    summary:
      "Productised web presence for small businesses in Argentina: orders, appointments, and reservations for a flat monthly fee.",
    stack: ["Next.js", "TypeScript", "Tailwind"],
    url: "https://empresimple.com",
    logo: "/logos/empresimple.png",
    screen: "/screens/empresimple.png",
  },
  {
    id: "william",
    name: "William",
    summary: "An online course school — catalogue, enrolment, and delivery.",
    stack: ["Next.js", "Neon", "Drizzle", "Auth.js", "Resend"],
    screen: "/screens/william.png",
    archived: true,
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
    archived: true,
  },
  {
    id: "blog-en20minutos",
    name: "En 20 Minutos — Blog",
    summary:
      "The public face of the podcasts: episode write-ups served from Contentful.",
    stack: ["Next.js", "Contentful", "TypeScript"],
    screen: "/screens/blog.png",
    archived: true,
  },
  {
    id: "poker-planning",
    name: "Poker Planning Game",
    summary: "Real-time estimation rounds for distributed teams.",
    stack: ["Next.js", "TypeScript"],
    screen: "/screens/poker.png",
    archived: true,
  },
];

/**
 * What the résumé lists.
 *
 * The world can show everything that was ever built; a résumé is a claim about
 * what is worth your time, and every extra line spends some of the attention
 * the good ones need.
 */
export const LISTED_PROJECTS = PROJECTS.filter((p) => !p.archived);
