import type { Credential } from "./types";

/** The degree hangs centred and larger; certificates flank it. */
export const CREDENTIALS: Credential[] = [
  {
    id: "uai",
    title: "B.S. Systems Engineering",
    issuer: "Universidad Abierta Interamericana",
    year: 2010,
    kind: "degree",
  },
  {
    id: "agile-pm",
    title: "Agile Project Management Professional",
    issuer: "Agile Certification",
    kind: "certification",
  },
  {
    id: "pmi-product",
    title: "Product Management",
    issuer: "PMI",
    kind: "certification",
  },
  {
    id: "devops",
    title: "DevOps Professional",
    issuer: "DevOps Institute",
    kind: "certification",
  },
  {
    id: "genai",
    title: "Career Essentials in Generative AI",
    issuer: "Microsoft",
    kind: "certification",
  },
  {
    id: "efset",
    title: "English C2 Proficient",
    issuer: "EFSET",
    kind: "certification",
  },
];

export const SKILLS = {
  "Delivery & Agile": [
    "Scrum", "SAFe", "Kanban", "SDLC", "Release Management",
    "Dependency Management", "Risk Management", "Requirements Gathering",
  ],
  Leadership: [
    "Stakeholder Management", "Cross-functional Team Leadership",
    "Executive Communication", "Program Delivery", "Product Ownership",
  ],
  "Cloud & Infrastructure": [
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes",
    "Terraform", "CI/CD", "CloudFormation",
  ],
  "Languages & Frameworks": [
    "JavaScript", "TypeScript", "React", "Node.js", "Next.js",
    "NestJS", "Python", ".NET", "PHP/Laravel",
  ],
  Tools: ["Jira", "Asana", "Monday", "Confluence", "Notion", "Figma", "Git"],
} as const;

export const LANGUAGES = [
  { name: "Spanish", level: "Native" },
  { name: "English", level: "C2 Proficient — EFSET certified" },
];
