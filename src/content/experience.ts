import type { Experience } from "./types";

/**
 * The career corridor, ordered by start date — the way the player walks it.
 *
 * `floorHeight` climbs monotonically: the corridor physically ascends as the
 * career does, so the progression from developer to TPM to founder is walked
 * rather than read. iMachinary is the *largest* room rather than the highest
 * one; the climb keeps going past it.
 *
 * Note: the IRC/Signpost contract (2018-2020) overlaps with the first years of
 * iMachinary. Stations are ordered by start date and each panel shows its own
 * dates, so the overlap reads correctly.
 */
export const EXPERIENCE: Experience[] = [
  {
    id: "hp",
    company: "Hewlett-Packard",
    logo: "/logos/hp.svg",
    client: "General Motors",
    tagline: "Where it started: mainframes and pagers.",
    set: {
      props: ["server-rack", "mainframe", "crt-terminal", "flickering-tube"],
      practicalLight: "#8FB89E",
      floorHeight: 0,
    },
    roles: [
      {
        title: "Service Information Developer II",
        from: "2006-03",
        to: "2011-04",
        highlights: [
          "Supported General Motors mainframe applications as a support analyst, owning incident resolution, root cause analysis, and maintenance for enterprise-critical systems.",
        ],
        stack: ["Mainframe", "Incident Management", "Root Cause Analysis"],
      },
    ],
  },
  {
    id: "paladini",
    company: "Paladini",
    logo: "/logos/paladini.svg",
    tagline: "Business software on a factory floor.",
    set: {
      props: ["conveyor", "industrial-pipe", "amber-screen", "crate-stack"],
      practicalLight: "#E8A33D",
      floorHeight: 3,
    },
    roles: [
      {
        title: "Systems Analyst",
        from: "2011-04",
        to: "2012-06",
        highlights: [
          "Built internal business applications in SAP/ABAP, supporting technical operations and systems analysis for a major consumer goods company.",
        ],
        stack: ["SAP", "ABAP", "Systems Analysis"],
      },
    ],
  },
  {
    id: "endava",
    company: "Endava",
    logo: "/logos/endava.svg",
    client: "WebMD",
    tagline: "Healthcare software, millions of users.",
    set: {
      props: ["open-space-desks", "monitor-row", "server-rack", "ceiling-grid"],
      practicalLight: "#C9D2DA",
      floorHeight: 6,
    },
    roles: [
      {
        title: "Senior Full-Stack Developer",
        from: "2012-06",
        to: "2014-02",
        highlights: [
          "Built frontend and backend for large-scale healthcare web applications used by millions, improving usability, performance, and stability inside an Agile team.",
        ],
        stack: [".NET", "MySQL", "Azure", "Jira", "Scrum"],
      },
    ],
  },
  {
    id: "ubisat",
    company: "UBISat",
    logo: "/logos/ubisat.svg",
    tagline: "Tracking vehicles — then tracking projects.",
    set: {
      props: ["gps-map-wall", "moving-dots", "whiteboard", "desk"],
      practicalLight: "#6FA8C7",
      floorHeight: 9,
    },
    roles: [
      {
        title: "Senior Full-Stack Developer",
        from: "2014-05",
        to: "2016-01",
        highlights: [
          "Designed and built a GPS vehicle and asset tracking system with custom client reporting, integrating frontend, backend, and third-party services into one production platform.",
        ],
        stack: [".NET", "PHP", "Laravel", "React", "MySQL", "MongoDB", "Azure"],
      },
      {
        title: "Technical Project Manager",
        from: "2016-01",
        to: "2018-01",
        highlights: [
          "Ran delivery across multiple concurrent software projects, owning planning, risk identification, and execution against business objectives.",
          "Translated business requirements into technical specifications, closing the gap between stakeholders and engineering.",
        ],
        stack: [".NET", "PHP", "Laravel", "React", "MySQL", "MongoDB", "Azure", "Jira", "Scrum"],
      },
    ],
  },
  {
    id: "irc",
    company: "IRC / Signpost",
    logo: "/logos/irc.svg",
    tagline: "Software for refugees. 79 million people reached.",
    set: {
      props: ["world-map", "pin-cluster", "warm-lamp", "paper-stack"],
      practicalLight: "#E8A33D",
      floorHeight: 13,
    },
    roles: [
      {
        title: "Engineering Team Lead (Contractor)",
        from: "2018-01",
        to: "2020-09",
        highlights: [
          "Led a lean team of 2 developers and 1 designer delivering refugee and asylum-seeker support software that reached 79 million people across multiple countries.",
          "Held 99.9% uptime on a mission-critical platform by setting engineering standards, building CI/CD pipelines, and introducing infrastructure-as-code.",
          "Owned the full SDLC across a multi-cloud stack, coordinating QA, security reviews, and stakeholder approvals from discovery to production.",
        ],
        stack: ["Node.js", "React", "PostgreSQL", "Python", "Django", "Azure", "Firebase", "AWS", "Kubernetes", "Docker", "Terraform", "Twilio"],
      },
    ],
  },
  {
    id: "imachinary",
    company: "iMachinary",
    logo: "/logos/imachinary.svg",
    tagline: "Founded it. Grew it to 25 people and +85% revenue.",
    set: {
      props: ["big-room", "chair-grid-25", "revenue-chart", "founder-plaque", "glass-wall"],
      practicalLight: "#E8A33D",
      floorHeight: 16,
    },
    roles: [
      {
        title: "Founder & CEO",
        from: "2019-01",
        to: "2023-07",
        highlights: [
          "Scaled the company to 25 people and grew revenue 85% over four years, with full accountability for P&L and strategic direction.",
          "Acted as Product Owner, aligning a multi-disciplinary team around a scalable B2B SaaS roadmap and shipping against market demand and client commitments.",
          "Engineered an internal vendor management portal and a workflow automation connector across Localization, CMS, and PM tools, cutting manual ops overhead.",
          "Owned executive relationships, partner negotiations, and investor communication as both technical lead and company ambassador.",
        ],
        stack: ["Node.js", "Next.js", "NestJS", "React", "DynamoDB", "MySQL", "AWS", "Azure", "Kubernetes", "Docker", "Terraform", "Stripe"],
      },
    ],
  },
  {
    id: "invenco",
    company: "Invenco by GVR",
    logo: "/logos/invenco.svg",
    client: "Chevron",
    tagline: "Payments at the fuel pump, across the US and Canada.",
    set: {
      props: ["fuel-dispenser", "payment-terminal", "safe-board", "canopy-light"],
      practicalLight: "#E8A33D",
      floorHeight: 20,
    },
    roles: [
      {
        title: "Technical Project Manager",
        from: "2023-07",
        to: "2025-02",
        highlights: [
          "Coordinated delivery for Chevron's payment platform across the US and Canada, leading 6 developers, QA engineers, and hardware specialists on high-availability fuel retail operations.",
          "Cut operational blockers by ~20% by redesigning issue resolution workflows and establishing dependency tracking across engineering, QA, hardware, and client stakeholders.",
          "Ran Agile ceremonies and release coordination inside a SAFe enterprise environment, holding delivery cadence for payment and mobile fueling integrations across regions.",
          "Served as the communication bridge between Program Managers, Engineering Managers, product teams, and external clients.",
        ],
        stack: ["SAFe", "Scrum", "Jira", "Confluence", "Azure", "Git"],
      },
    ],
  },
  {
    id: "techgenies",
    company: "TechGenies",
    logo: "/logos/techgenies.svg",
    tagline: "Today. The door at the top of the stairs.",
    set: {
      props: ["bright-office", "standing-desk", "kanban-screen", "open-door"],
      practicalLight: "#F2E4C9",
      floorHeight: 23,
    },
    roles: [
      {
        title: "Technical Project Manager",
        from: "2025-02",
        to: null,
        highlights: [
          "Own end-to-end delivery for multiple concurrent initiatives across teams of 4-8 engineers, coordinating cross-functional resources against scope, timeline, and business objectives.",
          "Replaced the internal Confluence + Jira stack with a custom-built product in React and Node, cutting documentation overhead and improving project tracking company-wide.",
          "Work as a hands-on Technical PM, contributing directly to development while bridging engineering and business stakeholders to unblock delivery.",
        ],
        stack: ["React", "Node.js", "Vue", "AWS", "Figma", "Jira", "Git", "Scrum"],
      },
    ],
  },
];
