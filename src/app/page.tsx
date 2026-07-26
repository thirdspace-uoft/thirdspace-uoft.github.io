import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  Calendar,
  Cpu,
  Globe,
  HeartHandshake,
  MapPin,
  Microscope,
  MoveUpRight,
  Orbit,
  Quote,
  Scale,
  Sparkles,
  Users,
} from "lucide-react";

import contentData from "../../public/config/content.json";
import { getAssetPath } from "@/lib/utils";

type IconName =
  | "Users"
  | "Calendar"
  | "Sparkles"
  | "Brain"
  | "HeartHandshake"
  | "Globe"
  | "Microscope"
  | "Scale";

const iconMap: Record<IconName, React.ComponentType<{ className?: string }>> = {
  Users,
  Calendar,
  Sparkles,
  Brain,
  HeartHandshake,
  Globe,
  Microscope,
  Scale,
};

export default function Home() {
  const {
    hero,
    home,
    marquee,
    groupOverview,
    professor,
    researchDomains,
    about,
    homePillars,
    pillars,
  } = contentData;

  return (
    <main className="bg-background">
      {/* HERO — editorial split, mono meta strip, generous whitespace */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 pt-16 pb-20 sm:px-8 sm:pt-24 sm:pb-28">
          {/* Meta strip */}
          <div className="mb-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border pb-4 sm:mb-16">
            <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <Orbit className="size-3 text-primary" />
              {hero.badge}
            </span>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <MapPin className="size-3 text-primary" />
              {hero.locationChip}
            </span>
          </div>
          {/* Headline + lede */}
          <div className="grid gap-12 md:gap-16 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-8">
              <h1 className="type-display text-foreground">
                <span className="block">Utilizing human values,</span>
                <span className="block font-semibold text-muted-foreground">
                  situated knowledge,
                </span>
                <span className="block">and lived experiences.</span>
              </h1>
            </div>

            <aside className="space-y-8 lg:col-span-4 lg:pt-3">
              <p className="type-body text-pretty text-muted-foreground">
                {hero.subParagraph}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="#about-group"
                  className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 type-body font-medium text-background transition-colors hover:bg-foreground/90"
                >
                  {hero.primaryActionText}
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/team"
                  className="inline-flex items-center gap-2 px-1 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {hero.secondaryActionText}
                  <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </aside>
          </div>

          {/* Plate — single photograph, no chrome */}
          <figure className="mt-16 grid gap-6 sm:mt-20 md:grid-cols-12">
            <div className="md:col-span-7">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={getAssetPath(hero.groupPhotoPath)}
                  alt={hero.groupPhotoAlt}
                  fill
                  priority
                  sizes="(min-width: 768px) 60vw, 100vw"
                  className="object-cover grayscale-[8%]"
                />
              </div>
              <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {hero.groupPhotoAlt}
              </figcaption>
            </div>

            <div className="flex flex-col justify-center md:col-span-5 md:px-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                {hero.researchPostureLabel}
              </span>
              <p className="mt-3 type-subhead text-foreground">
                {hero.researchPostureBody}
              </p>
              <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-6">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {hero.methodsLabel}
                  </dt>
                  <dd className="mt-2 type-body font-medium text-foreground">
                    {hero.methodsValue}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {hero.focusLabel}
                  </dt>
                  <dd className="mt-2 type-body font-medium text-foreground">
                    {hero.focusValue}
                  </dd>
                </div>
              </dl>
            </div>
          </figure>
        </div>

        {/* Marquee keyword band — kept, restrained */}
        <div className="overflow-hidden border-y border-border">
          <div className="flex w-max animate-marquee">
            {[...marquee.keywords, ...marquee.keywords].map((keyword, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground whitespace-nowrap"
              >
                <span>{keyword}</span>
                <span
                  aria-hidden
                  className="h-1 w-1 rounded-full bg-primary/40"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* GROUP OVERVIEW — body + PI side by side, then focus cards */}
      <section id="about-group" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-10 border-b border-border/80 pb-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {groupOverview.eyebrow}
            </span>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {groupOverview.headline}
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {groupOverview.locationChip}
              </span>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="text-pretty text-base leading-relaxed text-foreground/80">
                {groupOverview.body.split(professor.name)[0]}
                <a
                  href={professor.website}
                  target="_blank"
                  rel="noreferrer"
                  className="group/ishtiaque relative inline-flex items-baseline font-medium text-primary underline decoration-accent/70 decoration-2 underline-offset-4 transition-colors after:absolute after:left-0 after:top-full after:h-8 after:w-72 after:content-[''] hover:text-primary/80"
                  aria-label={`Visit ${professor.name}'s website`}
                >
                  {professor.name}
                  <span className="invisible pointer-events-auto absolute left-0 top-full z-50 mt-4 w-72 translate-y-3 rounded-[1.5rem] border border-primary/15 bg-card p-3 opacity-0 shadow-2xl shadow-primary/20 transition-all delay-300 duration-300 before:absolute before:-top-4 before:left-0 before:h-4 before:w-full before:content-[''] group-hover/ishtiaque:visible group-hover/ishtiaque:translate-y-1 group-hover/ishtiaque:opacity-100 group-hover/ishtiaque:delay-75">
                    <span className="block relative h-52 w-full overflow-hidden rounded-[1.1rem] bg-muted">
                      <Image
                        src={getAssetPath(professor.imagePath)}
                        alt={professor.name}
                        fill
                        sizes="288px"
                        className="object-cover transition-transform duration-500 group-hover/ishtiaque:scale-105"
                      />
                    </span>
                    <span className="mt-3 flex items-center justify-between gap-3 px-1 text-left">
                      <span>
                        <span className="block text-base font-semibold text-foreground">
                          {professor.name}
                        </span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {professor.title}
                          <br />
                          {professor.department}
                          <br />
                          {professor.institution}
                          <br />
                          {professor.role}
                        </span>
                      </span>
                      <MoveUpRight className="h-4 w-4 shrink-0 text-primary" />
                    </span>
                  </span>
                </a>
                {groupOverview.body.split(professor.name)[1]}
              </p>
            </div>

            <div className="lg:col-span-4 lg:col-start-9">
              <div className="flex flex-col items-start gap-5">
                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={getAssetPath(professor.imagePath)}
                    alt={professor.name}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xl font-semibold tracking-tight text-foreground">
                      {professor.name}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {home.groupOverviewFigLabel}
                    </p>
                  </div>
                  <div className="border-t border-border/60 pt-4">
                    <a
                      href={professor.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                      aria-label={`Visit ${professor.name}'s website`}
                    >
                      {professor.name}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {professor.title}, {professor.institution}.<br />
                      {professor.role}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {groupOverview.focusCards.map((item) => {
              const Icon =
                iconMap[item.icon as keyof typeof iconMap] || Globe;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-background p-6 transition-all duration-300 hover:border-primary/20"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <h3 className="mt-4 text-base font-medium leading-snug text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* LATEST RESEARCH + TEAM */}
      {(() => {
        const years = (contentData.publications.years ?? {}) as Record<string, any>;
        const yearKeys = Object.keys(years).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
        const latestYear = yearKeys[0];
        if (!latestYear) return null;

        const bucket = years[latestYear];
        const all: any[] = [
          ...(bucket.journalArticles ?? []),
          ...(bucket.conferenceProceedings ?? []),
          ...(bucket.extendedAbstracts ?? []),
          ...(bucket.researchArtifacts ?? []),
        ];
        if (all.length === 0) return null;

        const maxShow = contentData.latestPublications?.maxToShow ?? 4;
        const latest = all.slice(0, maxShow);

        const { professor, team } = contentData;
        const piMember: { name: string; role: string; imagePath?: string } | null =
          professor?.name ? { name: professor.name, role: professor.title ?? "Principal Investigator", imagePath: professor.imagePath } : null;
        const piName = piMember?.name ?? "";
        const researchers: { name: string; role: string; imagePath?: string }[] = [];
        for (const section of team?.sections ?? []) {
          for (const m of section.members ?? []) {
            if (m.name !== piName) {
              researchers.push({ name: m.name, role: section.role, imagePath: m.imagePath });
            }
          }
        }

        return (
          <section className="border-b border-border">
            <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
              <div className="mb-10 flex items-end justify-between gap-6 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {contentData.latestPublications?.eyebrow}
                  </span>
                  <span className="h-3 w-px bg-border" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                    {latestYear}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Link
                    href="/team"
                    className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {contentData.latestPublications?.viewAllLabel?.replace("publications", "team") ?? "Team"}
                    <ArrowRight className="size-3" />
                  </Link>
                  <span className="h-3 w-px bg-border" />
                  <Link
                    href={contentData.latestPublications?.viewAllHref ?? "/publications"}
                    className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {contentData.latestPublications?.viewAllLabel}
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-10 lg:grid-cols-12">
                {/* Publications — 2/3 */}
                <div className="lg:col-span-8">
                  <div className="grid gap-px bg-border sm:grid-cols-2">
                    {latest.map((pub: any, i: number) => (
                      <article
                        key={pub.id ?? `latest-${i}`}
                        className="bg-background p-6 transition-colors hover:bg-muted/20 sm:p-7"
                      >
                        {pub.award && (
                          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/8 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-accent-foreground">
                            <svg viewBox="0 0 24 24" className="size-2.5 fill-accent" aria-hidden>
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            {pub.award}
                          </span>
                        )}
                        <h3 className="text-[14px] font-medium leading-snug text-foreground">
                          {pub.url ? (
                            <Link
                              href={pub.url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline decoration-primary/25 underline-offset-2 transition-colors hover:text-primary hover:decoration-primary"
                            >
                              {pub.title}
                            </Link>
                          ) : (
                            pub.title
                          )}
                        </h3>
                        {pub.authors && (
                          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground line-clamp-1">
                            {pub.authors}
                          </p>
                        )}
                        {pub.venue && (
                          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-primary/80">
                            {pub.venue}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                </div>

                {/* Team sidebar — 1/3 */}
                <aside className="lg:col-span-4">
                  <div className="rounded-2xl border border-border bg-background p-6">

                    {/* Principal Investigator */}
                    {piMember && (
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                          Principal Investigator
                        </span>
                        <div className="mt-4 flex items-center gap-3">
                          {piMember.imagePath ? (
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border">
                              <Image
                                src={getAssetPath(piMember.imagePath)}
                                alt={piMember.name}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted">
                              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                                {piMember.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[14px] font-medium leading-snug text-foreground">
                              {piMember.name}
                            </p>
                            <p className="text-[12px] leading-snug text-muted-foreground">
                              {piMember.role}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Researchers */}
                    {researchers.length > 0 && (
                      <div className="mt-6 border-t border-border pt-5">
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                          Researchers
                        </span>
                        <div className="mt-4 space-y-3">
                          {researchers.slice(0, 5).map((m, i) => (
                            <div key={i} className="flex items-center gap-3">
                              {m.imagePath ? (
                                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border">
                                  <Image
                                    src={getAssetPath(m.imagePath)}
                                    alt={m.name}
                                    fill
                                    sizes="56px"
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted">
                                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                                    {m.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                                  </span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium leading-snug text-foreground truncate">
                                  {m.name}
                                </p>
                                <p className="text-[11px] leading-snug text-muted-foreground truncate">
                                  {m.role}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Link
                      href="/team"
                      className="mt-6 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary transition-colors hover:text-primary/70"
                    >
                      All members
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </aside>
              </div>

              {/* Featured researchers — full width below */}
              {(() => {
                const allSectionsMembers = (contentData.team?.sections ?? []).flatMap((s: any) => s.members ?? []);
                const featured: any[] = [];
                const sheza = allSectionsMembers.find((m: any) => m.name.toLowerCase().includes("sheza"));
                const rama = allSectionsMembers.find((m: any) => m.name.toLowerCase().includes("ramaravind"));
                if (sheza) featured.push(sheza);
                if (rama) featured.push(rama);
                if (featured.length === 0) return null;
                return (
                  <div className="mt-10">
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                      Featured researcher
                    </span>
                    <div className="mt-4 grid gap-6 md:grid-cols-2">
                      {featured.map((fullData, fIdx) => (
                        <div key={fIdx} className="rounded-2xl border border-border bg-background p-7">
                          <div className="flex items-center gap-4">
                            {fullData.imagePath ? (
                              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border">
                                <Image
                                  src={getAssetPath(fullData.imagePath)}
                                  alt={fullData.name}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-primary">
                                  {fullData.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="text-[15px] font-medium text-foreground">{fullData.name}</p>
                              <p className="text-[12px] text-muted-foreground">{fullData.focus}</p>
                            </div>
                          </div>
                          {fullData.bio && (
                            <p className="mt-4 text-[13px] leading-relaxed text-foreground/80 line-clamp-3">
                              {fullData.bio}
                            </p>
                          )}
                          {fullData.areasOfInterest && fullData.areasOfInterest.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {fullData.areasOfInterest.slice(0, 4).map((a: string, i: number) => (
                                <span
                                  key={i}
                                  className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground"
                                >
                                  {a}
                                </span>
                              ))}
                            </div>
                          )}
                          {fullData.awards && fullData.awards.length > 0 && (
                            <div className="mt-4">
                              <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                                Awards
                              </span>
                              <div className="mt-2 space-y-1.5">
                                {fullData.awards.map((aw: string, ai: number) => (
                                  <div
                                    key={ai}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/8 px-3 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-accent-foreground"
                                  >
                                    <svg viewBox="0 0 24 24" className="size-2.5 fill-accent" aria-hidden>
                                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                    {aw}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {fullData.links && fullData.links[0] && (
                            <Link
                              href={fullData.links[0].url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-primary transition-colors hover:text-primary/70"
                            >
                              {fullData.links[0].label}
                              <ArrowRight className="size-2.5" />
                            </Link>
                          )}

                          {/* Contributed publications */}
                          {(() => {
                            const nameParts = fullData.name.toLowerCase().split(" ");
                            const nameKey = nameParts[0];
                            const pubs: any[] = [];
                            for (const [y, bucket] of Object.entries(contentData.publications.years ?? {})) {
                              for (const items of Object.values(bucket as any)) {
                                if (!Array.isArray(items)) continue;
                                for (const p of items) {
                                  if (p.authors && p.authors.toLowerCase().includes(nameKey)) {
                                    pubs.push({ year: y, ...p });
                                  }
                                }
                              }
                            }
                            const top = pubs.sort((a, b) => (a.year < b.year ? 1 : -1)).slice(0, 3);
                            if (top.length === 0) return null;
                            return (
                              <div className="mt-5 border-t border-border pt-4">
                                <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                                  Recent publications
                                </span>
                                <ul className="mt-3 space-y-2.5">
                                  {top.map((p, pi) => (
                                    <li key={pi}>
                                      {p.award && (
                                        <span className="mb-1 inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/8 px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.12em] text-accent-foreground">
                                          <svg viewBox="0 0 24 24" className="size-2 fill-accent" aria-hidden>
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                          </svg>
                                          {p.award}
                                        </span>
                                      )}
                                      <p className="text-[12px] leading-snug text-foreground">
                                        {p.url ? (
                                          <Link
                                            href={p.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="underline decoration-primary/20 underline-offset-2 transition-colors hover:text-primary hover:decoration-primary"
                                          >
                                            {p.title}
                                          </Link>
                                        ) : (
                                          p.title
                                        )}
                                      </p>
                                      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-primary/70">
                                        {p.venue ? `${p.venue} · ` : ""}{p.year}
                                      </p>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        );
      })()}

      {/* ABOUT THE GROUP — quote, hairline-left accent */}
      {about && (
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Quote className="size-4 text-primary" />
              <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {about.title}
              </h2>
            </div>
            <p className="mt-10 max-w-3xl border-l border-primary pl-6 text-foreground">
              {about.body}
            </p>
            {(about as { ctaLabel?: string; ctaHref?: string }).ctaLabel && (
              <Link
                href={(about as { ctaHref?: string }).ctaHref ?? "/about"}
                className="group mt-10 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground transition-colors hover:text-primary"
              >
                {(about as { ctaLabel?: string }).ctaLabel}
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* RESEARCH DOMAINS — clean 2-col index, hairline rules, no bento */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="mb-10 flex items-baseline justify-between gap-6 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Cpu className="size-3.5 text-primary" />
              <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {researchDomains.sectionLabel}
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-emerald-500"
              />
              {researchDomains.statusLabel}
            </span>
          </div>

          <ul className="grid gap-x-12 gap-y-0 sm:grid-cols-2 md:gap-x-16">
            {researchDomains.items.map((item, index) => {
              const Icon = iconMap[item.icon as IconName] ?? iconMap.Globe;
              return (
                <li
                  key={item.title}
                  className="group/dom border-b border-border py-7 sm:py-8"
                >
                  <div className="flex items-start gap-3">
                      <Icon className="mt-1 size-4 shrink-0 text-primary" />
                      <div>
                        <h3 className="type-body font-medium text-foreground">
                          {item.title}
                        </h3>
                        <p className="mt-2 max-w-md type-body text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* PILLARS — three columns, hairline borders, no shadows */}
      <section>
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="mb-12 border-b border-border pb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {homePillars.eyebrow}
            </span>
          </div>

          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar, index) => {
              const Icon = iconMap[pillar.icon as IconName] ?? iconMap.Sparkles;
              return (
                <article
                  key={pillar.id}
                  className="bg-background p-8 transition-colors hover:bg-muted/40 sm:p-10"
                >
                  <Icon className="size-4 text-primary" />
                  <h3 className="mt-10 type-subhead text-foreground">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 type-body text-muted-foreground">
                    {pillar.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
