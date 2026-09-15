"use client";

import { useEffect, useRef } from "react";
import {
  BOOKS,
  CREDENTIALS,
  EXPERIENCE,
  LANGUAGES,
  MARKETPLACES,
  PROFILE,
  PODCAST_CHANNEL,
  PODCAST_BLOG,
  PROJECTS,
  SHOWS,
  VOLUMES,
  INTERESTS,
  formatRange,
  kindleLink,
} from "@/content";
import {
  AmazonIcon,
  SPOTIFY_GREEN,
  SpotifyIcon,
  YouTubeIcon,
} from "@/ui/BrandIcons";
import { useGame } from "../core/store";

/**
 * The content, as real HTML.
 *
 * Text drawn into the 3D scene would be blurry, unselectable and invisible to
 * a screen reader. A panel over the canvas keeps the words crisp, copyable and
 * navigable by keyboard — the game is the way in, not a reason to make the
 * substance worse.
 */
export function Panel() {
  const panel = useGame((s) => s.panel);
  const closePanel = useGame((s) => s.closePanel);
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!panel) return;
    closeButton.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePanel();
        return;
      }
      if (e.key !== "Tab") return;

      // Keep focus inside the dialog while it is open.
      const focusable = dialog.current?.querySelectorAll<HTMLElement>(
        'a[href], button, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [panel, closePanel]);

  if (!panel) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-void/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={closePanel}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={panel.kind}
        className={`max-h-[85dvh] w-full overflow-y-auto rounded-t-xl border border-edge bg-mid px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:rounded-xl sm:pb-6 ${
          // The catalogue panels lay out in two columns; the extra width is
          // what buys the second one, and with it most of the scrolling.
          panel.kind === "books" || panel.kind === "shows"
            ? "max-w-4xl"
            : "max-w-2xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {panel.kind === "experience" && <ExperiencePanel id={panel.id} />}
        {panel.kind === "project" && <ProjectPanel id={panel.id} />}
        {panel.kind === "book" && <BookPanel id={panel.id} />}
        {panel.kind === "volume" && <VolumePanel id={panel.id} />}
        {panel.kind === "show" && <ShowPanel id={panel.id} />}
        {panel.kind === "credentials" && <CredentialsPanel />}
        {panel.kind === "books" && <BooksPanel />}
        {panel.kind === "shows" && <ShowsPanel />}
        {panel.kind === "interests" && <InterestsPanel />}
        {panel.kind === "contact" && <ContactPanel />}

        <button
          ref={closeButton}
          type="button"
          onClick={closePanel}
          className="mt-8 w-full rounded border border-edge py-2 font-mono text-xs uppercase tracking-widest text-muted hover:border-accent hover:text-accent"
        >
          Close · Esc
        </button>
      </div>
    </div>
  );
}

function ExperiencePanel({ id }: { id: string }) {
  const job = EXPERIENCE.find((e) => e.id === id);
  if (!job) return null;

  return (
    <article>
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-text">
          {job.company}
        </h2>
        {job.client && (
          <p className="mt-1 text-sm text-muted">Client: {job.client}</p>
        )}
        <p className="mt-3 text-accent">{job.tagline}</p>
      </header>

      {job.roles.map((role) => (
        <section key={role.title} className="mt-7 border-t border-edge pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <h3 className="font-medium text-text">{role.title}</h3>
            <p className="font-mono text-sm text-muted">
              {formatRange(role.from, role.to)}
            </p>
          </div>

          <ul className="mt-3 space-y-2">
            {role.highlights.map((line) => (
              <li key={line} className="flex gap-3 text-sm leading-relaxed text-text/90">
                <span aria-hidden className="text-edge">—</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <p className="mt-3 font-mono text-xs text-muted">
            {role.stack.join(" · ")}
          </p>
        </section>
      ))}
    </article>
  );
}

function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <header>
      <h2 className="text-2xl font-semibold tracking-tight text-text">{title}</h2>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </header>
  );
}

/**
 * A brand mark, on its own white plate.
 *
 * Every logo here was drawn for its own site, on its own background. Two of
 * them are dark artwork and one is a JPEG with white baked in, so dropping
 * them straight onto this palette would lose two and box the third. The plate
 * costs one small rectangle of light and keeps all four legible and correct.
 */
function LogoPlate({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="inline-flex h-12 shrink-0 items-center justify-center rounded-md bg-white px-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- a static mark in
          a modal; the image component's layout machinery buys nothing here. */}
      <img src={src} alt={alt} className="h-7 w-auto max-w-[150px] object-contain" />
    </span>
  );
}

function ProjectPanel({ id }: { id: string }) {
  const project = PROJECTS.find((p) => p.id === id);
  if (!project) return null;

  return (
    <article>
      <div className="flex items-center gap-4">
        {project.logo && <LogoPlate src={project.logo} alt={`${project.name} logo`} />}
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-text">
            {project.name}
          </h2>
          {project.wip && (
            <p className="mt-1 font-mono text-xs uppercase tracking-wider text-accent">
              In progress
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 leading-relaxed text-text/90">{project.summary}</p>
      <p className="mt-4 font-mono text-xs text-muted">
        {project.stack.join(" · ")}
      </p>
      {project.url && (
        <a
          href={project.url}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-block rounded bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wider text-void"
        >
          {project.url.replace(/^https?:\/\/(www\.)?/, "")}
        </a>
      )}
    </article>
  );
}

/**
 * The surface every outbound brand button shares.
 *
 * White rather than the site accent. Amber is the one warm colour in this
 * palette and it is spoken for — it marks what the player can interact with,
 * so spending it on six Spotify buttons and six Amazon buttons shouts over
 * everything the panel is actually saying. White recedes, and it lets each
 * mark keep its own colour on top.
 */
const BRAND_BUTTON =
  "inline-flex items-center gap-2 rounded bg-white font-semibold uppercase tracking-wider text-void";

/** The one call to action a book has. Same shape everywhere it appears. */
function AmazonButton({
  asin,
  compact = false,
}: {
  asin: string;
  compact?: boolean;
}) {
  return (
    <a
      href={kindleLink(asin, "us")}
      target="_blank"
      rel="noreferrer"
      className={`${BRAND_BUTTON} ${
        compact ? "px-2.5 py-1.5 text-[0.65rem]" : "px-4 py-2 text-xs"
      }`}
    >
      <AmazonIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {compact ? "Amazon" : "Read it on Amazon"}
    </a>
  );
}

function BookPanel({ id }: { id: string }) {
  const book = BOOKS.find((b) => b.id === id);
  if (!book) return null;

  return (
    <article>
      <Heading title={book.title} sub={book.subtitle} />

      <p className="mt-3 flex flex-wrap items-center gap-x-3 font-mono text-xs uppercase tracking-wider text-muted">
        <span
          className="inline-block h-3 w-3 rounded-sm"
          style={{ background: book.color }}
          aria-hidden
        />
        <span>{book.format === "paperback" ? "Paperback" : "Kindle"}</span>
        {book.language === "es" && <span>Spanish edition</span>}
      </p>

      <p className="mt-5 leading-relaxed text-text/90">{book.excerpt}</p>

      <p className="mt-6">
        <AmazonButton asin={book.asin} />
      </p>

      <p className="mt-3 font-mono text-xs text-muted">
        Also in{" "}
        {MARKETPLACES.filter((m) => m !== "us").map((market) => (
          <a
            key={market}
            href={kindleLink(book.asin, market)}
            target="_blank"
            rel="noreferrer"
            className="mr-2 hover:text-accent"
          >
            {market.toUpperCase()}
          </a>
        ))}
      </p>
    </article>
  );
}

function VolumePanel({ id }: { id: string }) {
  const volume = VOLUMES.find((v) => v.id === id);
  if (!volume) return null;
  const show = SHOWS.find((s) => s.id === volume.show);

  return (
    <article>
      <Heading title={volume.title} sub={show?.nativeName} />
      <div className="mt-5 flex flex-wrap items-start gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- a static
            cover in a modal; the image component's layout machinery buys
            nothing here. */}
        <img
          src={volume.cover}
          alt={`Cover of ${volume.title}`}
          className="w-32 rounded border border-edge"
        />
        <div className="flex-1">
          {show && <p className="leading-relaxed text-text/90">{show.summary}</p>}
          {volume.asin ? (
            <p className="mt-4 font-mono text-sm">
              <span className="text-muted">Kindle: </span>
              {MARKETPLACES.map((market) => (
                <a
                  key={market}
                  href={kindleLink(volume.asin!, market)}
                  target="_blank"
                  rel="noreferrer"
                  className="mr-2 text-muted hover:text-accent"
                >
                  {market.toUpperCase()}
                </a>
              ))}
            </p>
          ) : (
            <p className="mt-4 font-mono text-sm text-muted">Not yet published.</p>
          )}
        </div>
      </div>
    </article>
  );
}

function ShowPanel({ id }: { id: string }) {
  const show = SHOWS.find((s) => s.id === id);
  if (!show) return null;

  return (
    <article>
      <Heading title={show.nativeName} sub={show.name} />
      <p className="mt-4 leading-relaxed text-text/90">{show.summary}</p>

      <p className="mt-6 flex flex-wrap gap-2">
        <a
          href={show.spotify}
          target="_blank"
          rel="noreferrer"
          className={`${BRAND_BUTTON} px-4 py-2 text-xs`}
        >
          <SpotifyIcon style={{ color: SPOTIFY_GREEN }} />
          Listen on Spotify
        </a>
        <a
          href={PODCAST_CHANNEL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded border border-edge px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted hover:border-accent hover:text-accent"
        >
          <YouTubeIcon />
          Watch on YouTube
        </a>
        <a
          href={PODCAST_BLOG}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded border border-edge px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted hover:border-accent hover:text-accent"
        >
          Read the blog
        </a>
      </p>
    </article>
  );
}

function CredentialsPanel() {
  const degree = CREDENTIALS.find((c) => c.kind === "degree");
  const certificates = CREDENTIALS.filter((c) => c.kind === "certification");

  return (
    <article>
      <Heading title="Education & Certifications" />
      {degree && (
        <p className="mt-4 text-text">
          <span className="font-medium">{degree.title}</span>
          <span className="text-muted"> — {degree.issuer}</span>
          {degree.year && <span className="font-mono text-muted"> {degree.year}</span>}
        </p>
      )}
      <ul className="mt-4 space-y-2 border-t border-edge pt-4">
        {certificates.map((c) => (
          <li key={c.id} className="flex flex-wrap gap-x-3 text-sm">
            <span className="text-text">{c.title}</span>
            <span className="text-muted">{c.issuer}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 font-mono text-xs text-muted">
        {LANGUAGES.map((l) => `${l.name} (${l.level})`).join(" · ")}
      </p>
    </article>
  );
}

function ContactPanel() {
  const links = [
    { label: "Email", href: `mailto:${PROFILE.email}`, text: PROFILE.email },
    { label: "LinkedIn", href: PROFILE.linkedin, text: "linkedin.com/in/andresaguilar" },
    { label: "GitHub", href: PROFILE.github, text: "github.com/andresdaguilar" },
    { label: "Résumé", href: PROFILE.resume, text: "Download the PDF" },
  ];

  return (
    <article>
      <Heading title={PROFILE.name} sub={PROFILE.title} />
      <p className="mt-4 leading-relaxed text-text/90">{PROFILE.summary}</p>
      <ul className="mt-5 space-y-2 border-t border-edge pt-4">
        {links.map((link) => (
          <li key={link.label} className="flex gap-3 text-sm">
            <span className="w-20 shrink-0 font-mono text-muted">{link.label}</span>
            <a href={link.href} className="text-accent underline underline-offset-4">
              {link.text}
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}

/** The whole shelf, for a hotspot that marks the library rather than a book. */
/** The whole shelf, for a hotspot that marks the library rather than a book. */
function BooksPanel() {
  return (
    <article>
      <Heading title="Written" sub={`${BOOKS.length} books, all on Amazon`} />

      {/*
        Two columns, and every excerpt clamped to four lines. Six full blurbs
        stacked one under another is three screens of scrolling to learn that
        six books exist — which is the one thing the panel should say without
        being scrolled at all. The whole excerpt is still a click away, in the
        book's own panel out on the map.
      */}
      <ul className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {BOOKS.map((book) => (
          <li key={book.id} className="flex flex-col">
            <p className="flex flex-wrap items-baseline gap-x-2.5">
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-sm"
                style={{ background: book.color }}
                aria-hidden
              />
              <span className="font-medium text-text">{book.title}</span>
              {book.language === "es" && (
                <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                  Spanish
                </span>
              )}
            </p>
            {book.subtitle && (
              <p className="mt-0.5 line-clamp-1 pl-[1.375rem] text-sm text-muted">
                {book.subtitle}
              </p>
            )}
            <p className="mt-1.5 line-clamp-3 pl-[1.375rem] text-sm leading-relaxed text-text/80">
              {book.excerpt}
            </p>
            <p className="mt-2.5 pl-[1.375rem]">
              <AmazonButton asin={book.asin} compact />
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-6 border-t border-edge pt-4 text-sm text-muted">
        Collected from the podcasts: {VOLUMES.length} volumes of{" "}
        <em>En 20 Minutos</em>.
      </p>
    </article>
  );
}

/** All six, for a hotspot that marks the studio rather than one show. */
function ShowsPanel() {
  return (
    <article>
      <Heading
        title="En 20 Minutos"
        sub="Six shows, written, narrated and produced solo"
      />

      <ul className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {SHOWS.map((show) => (
          <li key={show.id}>
            <p className="flex flex-wrap items-baseline gap-x-2.5">
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-sm"
                style={{ background: show.color }}
                aria-hidden
              />
              <span className="font-medium text-text">{show.nativeName}</span>
            </p>
            <p className="mt-0.5 pl-[1.375rem] text-sm text-text/80">
              {show.summary}
            </p>
            <p className="mt-2 pl-[1.375rem]">
              <a
                href={show.spotify}
                target="_blank"
                rel="noreferrer"
                className={`${BRAND_BUTTON} px-2.5 py-1.5 text-[0.65rem]`}
              >
                <SpotifyIcon
                  className="h-3.5 w-3.5"
                  style={{ color: SPOTIFY_GREEN }}
                />
                Spotify
              </a>
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-edge pt-4">
        <p className="flex flex-wrap gap-2">
          <a
            href={PODCAST_CHANNEL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded border border-edge px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted hover:border-accent hover:text-accent"
          >
            <YouTubeIcon />
            All six on YouTube
          </a>
          <a
            href={PODCAST_BLOG}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded border border-edge px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted hover:border-accent hover:text-accent"
          >
            Read the blog
          </a>
        </p>
        <p className="mt-3 text-sm text-muted">
          {VOLUMES.length} volumes have been collected into books.
        </p>
      </div>
    </article>
  );
}

function InterestsPanel() {
  return (
    <article>
      <Heading title="Hobbies" sub="What the other hours are for" />
      <ul className="mt-5 space-y-5">
        {INTERESTS.map((interest) => (
          <li key={interest.id}>
            <p className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-medium text-text">{interest.name}</span>
              {interest.note && (
                <span className="font-mono text-xs uppercase tracking-wider text-accent">
                  {interest.note}
                </span>
              )}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text/85">
              {interest.line}
            </p>
          </li>
        ))}
      </ul>
    </article>
  );
}
