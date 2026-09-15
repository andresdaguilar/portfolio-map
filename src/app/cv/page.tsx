import type { Metadata } from "next";
import Link from "next/link";
import {
  BOOKS,
  CREDENTIALS,
  EXPERIENCE,
  INTERESTS,
  LANGUAGES,
  PODCAST_CHANNEL,
  PODCAST_BLOG,
  PROFILE,
  PROJECTS,
  SHOWS,
  SKILLS,
  VOLUMES,
  formatRange,
  kindleLink,
} from "@/content";
import { AmazonIcon, SPOTIFY_GREEN, SpotifyIcon } from "@/ui/BrandIcons";

/**
 * The accessible fallback.
 *
 * A WebGL canvas is invisible to search engines, to screen readers, and to
 * anyone on a phone that cannot hold 30fps. This page renders the same content
 * layer as the game with no JavaScript at all, and is what actually gets
 * indexed. It is not a lesser version — it is the one a recruiter in a hurry
 * will read.
 */
export const metadata: Metadata = {
  title: `${PROFILE.name} — Résumé`,
  description: PROFILE.summary,
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16">
      <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-accent">
        {title}
      </h2>
      <div className="mt-6 border-t border-edge pt-6">{children}</div>
    </section>
  );
}

export default function CvPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:px-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {PROFILE.name}
        </h1>
        <p className="mt-2 text-lg text-muted">{PROFILE.title}</p>
        <p className="mt-6 leading-relaxed text-balance">{PROFILE.summary}</p>

        <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-sm text-muted">
          <li>{PROFILE.location}</li>
          <li>
            <a className="hover:text-accent" href={`mailto:${PROFILE.email}`}>
              {PROFILE.email}
            </a>
          </li>
          <li>
            <a className="hover:text-accent" href={PROFILE.linkedin}>
              LinkedIn
            </a>
          </li>
          <li>
            <a className="hover:text-accent" href={PROFILE.github}>
              GitHub
            </a>
          </li>
          <li>
            <a className="hover:text-accent" href={PROFILE.resume}>
              Résumé (PDF)
            </a>
          </li>
        </ul>

        <p className="mt-8 rounded border border-edge bg-mid px-4 py-3 text-sm text-muted">
          There is a{" "}
          <Link href="/" className="text-accent underline underline-offset-4">
            map you can walk
          </Link>
          . This one is faster.
        </p>
      </header>

      <Section title="Experience">
        <ol className="space-y-10">
          {[...EXPERIENCE].reverse().map((job) => (
            <li key={job.id}>
              <h3 className="text-lg font-medium">
                {job.company}
                {job.client && (
                  <span className="text-muted"> · client: {job.client}</span>
                )}
              </h3>
              {job.roles.map((role) => (
                <div key={role.title} className="mt-4">
                  <p className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <span className="font-medium">{role.title}</span>
                    <span className="font-mono text-sm text-muted">
                      {formatRange(role.from, role.to)}
                    </span>
                  </p>
                  <ul className="mt-2 space-y-2">
                    {role.highlights.map((h) => (
                      <li key={h} className="flex gap-3 leading-relaxed">
                        <span aria-hidden className="text-edge">—</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 font-mono text-xs text-muted">
                    {role.stack.join(" · ")}
                  </p>
                </div>
              ))}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Education & Certifications">
        <ul className="space-y-3">
          {CREDENTIALS.map((c) => (
            <li key={c.id} className="flex flex-wrap items-baseline gap-x-3">
              <span className={c.kind === "degree" ? "font-medium" : ""}>
                {c.title}
              </span>
              <span className="text-muted">{c.issuer}</span>
              {c.year && (
                <span className="font-mono text-sm text-muted">{c.year}</span>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Skills">
        <dl className="space-y-4">
          {Object.entries(SKILLS).map(([group, items]) => (
            <div key={group}>
              <dt className="text-sm font-medium">{group}</dt>
              <dd className="mt-1 font-mono text-sm text-muted">
                {items.join(" · ")}
              </dd>
            </div>
          ))}
          <div>
            <dt className="text-sm font-medium">Languages</dt>
            <dd className="mt-1 font-mono text-sm text-muted">
              {LANGUAGES.map((l) => `${l.name} (${l.level})`).join(" · ")}
            </dd>
          </div>
        </dl>
      </Section>

      <Section title="Projects">
        <ul className="space-y-6">
          {PROJECTS.map((p) => (
            <li key={p.id} className="flex gap-4">
              {p.logo && (
                <span className="hidden h-11 w-16 shrink-0 items-center justify-center rounded-md bg-white px-2 sm:inline-flex">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a
                      static mark on a no-JavaScript page. */}
                  <img
                    src={p.logo}
                    alt=""
                    className="h-6 w-auto object-contain"
                  />
                </span>
              )}
              <div className="min-w-0">
                <h3 className="flex flex-wrap items-baseline gap-x-3 font-medium">
                  {p.url ? (
                    <a
                      href={p.url}
                      className="text-accent underline underline-offset-4"
                    >
                      {p.name}
                    </a>
                  ) : (
                    p.name
                  )}
                  {p.wip && (
                    <span className="font-mono text-xs uppercase tracking-wider text-muted">
                      In progress
                    </span>
                  )}
                </h3>
                <p className="mt-1 leading-relaxed">{p.summary}</p>
                <p className="mt-1 font-mono text-xs text-muted">
                  {p.stack.join(" · ")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Podcasts">
        <p className="mb-6 text-muted">
          <em>En 20 Minutos</em> — six Spanish-language shows, written, narrated,
          and produced solo. All of them on{" "}
          <a href={PODCAST_CHANNEL} className="text-accent underline underline-offset-4">
            YouTube
          </a>
          , with the written companion at{" "}
          <a href={PODCAST_BLOG} className="text-accent underline underline-offset-4">
            en20minutos.com
          </a>
          .
        </p>
        <ul className="space-y-4">
          {SHOWS.map((show) => (
            <li key={show.id}>
              <p className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-medium">{show.nativeName}</span>
                <a
                  href={show.spotify}
                  className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-accent underline underline-offset-4"
                >
                  <SpotifyIcon className="h-3.5 w-3.5" style={{ color: SPOTIFY_GREEN }} />
                  Spotify
                </a>
              </p>
              <p className="mt-0.5 text-muted">{show.summary}</p>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-muted">
          {VOLUMES.length} volumes collected into books:{" "}
          {VOLUMES.map((volume, i) => (
            <span key={volume.id}>
              {i > 0 && " · "}
              {volume.asin ? (
                <a
                  href={kindleLink(volume.asin, "us")}
                  className="text-accent underline underline-offset-4"
                >
                  {volume.title}
                </a>
              ) : (
                volume.title
              )}
            </span>
          ))}
        </p>
      </Section>

      <Section title="Books">
        <ul className="space-y-6">
          {BOOKS.map((book) => (
            <li key={book.id}>
              <h3 className="font-medium">
                {book.title}
                {book.language === "es" && (
                  <span className="ml-2 font-mono text-xs uppercase tracking-wider text-muted">
                    Spanish
                  </span>
                )}
              </h3>
              {book.subtitle && (
                <p className="mt-0.5 text-sm text-muted">{book.subtitle}</p>
              )}
              <p className="mt-1.5 leading-relaxed text-text/85">{book.excerpt}</p>
              <p className="mt-2">
                <a
                  href={kindleLink(book.asin, "us")}
                  className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-accent underline underline-offset-4"
                >
                  <AmazonIcon className="h-3.5 w-3.5" />
                  Amazon
                </a>
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Away from the keyboard">
        <ul className="space-y-4">
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
              <p className="mt-1 leading-relaxed text-text/85">{interest.line}</p>
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}
