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
  Microscope,
  Scale,
  Sparkles,
  Users,
} from "lucide-react";

import { getImageUrl } from "@/lib/utils";
import { getContent } from "@/lib/content";
import { memberAnchor } from "@/lib/people";
import { ResearcherRail, type RailMember } from "@/components/researcher-rail";

const contentData = getContent();
const {
  hero,
  home,
  professor,
  researchDomains,
} = contentData;

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
  return (
    <main className="bg-background">
      {/* HERO — editorial side-by-side layout: mission text on left, full uncropped lab photo on right */}
      <section data-section="hero" data-section-label="Home" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Mission & Headline column — below image on phone (order-2), left side on desktop (lg:order-1) */}
            <div className="order-2 min-w-0 lg:order-1 lg:col-span-5">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem] lg:leading-[1.14]">
                <span className="block">{hero.headlineLine1}</span>
                <span className="block text-primary">{hero.headlineLine2}</span>
                <span className="block text-foreground/90">{hero.headlineLine3}</span>
              </h1>

              <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {hero.subParagraph}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/people"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
                >
                  <Users className="size-4" />
                  {hero.secondaryActionText || "Research Group"}
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/publications"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted/60"
                >
                  Publications
                  <ArrowUpRight className="size-3.5 text-muted-foreground" />
                </Link>
              </div>
            </div>

            {/* Lab group photo column — on top on phone (order-1), right side on desktop (lg:order-2) */}
            <div className="order-1 min-w-0 lg:order-2 lg:col-span-7">
              <figure className="relative aspect-[1478/802] w-full overflow-hidden rounded-2xl shadow-lg transition-shadow hover:shadow-xl">
                <Image
                  src={getImageUrl(hero.groupPhotoPath)}
                  alt={hero.groupPhotoAlt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 680px"
                  className="h-full w-full object-cover"
                />
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* GROUP OVERVIEW — PI card on top + Researcher Grid below */}
      <section id="about-group" data-section="people" data-section-label="People" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          {/* Section Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Our People
            </h2>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Faculty, researchers, and students driving human-centered computing and responsible AI.
            </p>
          </div>

          {/* Featured PI Card — compact on mobile, rich on desktop */}
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-all sm:p-8">
            <div className="flex items-center gap-4 sm:items-start sm:gap-8 lg:gap-10">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted shadow-xs sm:size-36 sm:rounded-2xl lg:size-40">
                <Image
                  src={getImageUrl(professor.imagePath)}
                  alt={professor.name}
                  fill
                  sizes="(max-width: 640px) 80px, 160px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary sm:text-xs">
                    {home.groupOverviewFigLabel || "Principal Investigator"}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {professor.institution}
                  </span>
                </div>

                <div className="mt-1 sm:mt-2.5">
                  <a
                    href={professor.website}
                    target="_blank"
                    rel="noreferrer"
                    className="group/name inline-flex items-center gap-1.5 text-lg font-bold tracking-tight text-foreground transition-colors hover:text-primary sm:text-2xl lg:text-3xl"
                  >
                    <span>{professor.name}</span>
                    <ArrowUpRight className="size-4 text-primary transition-transform group-hover/name:translate-x-0.5 group-hover/name:-translate-y-0.5 sm:size-5" />
                  </a>
                </div>

                <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1.5 sm:text-sm sm:font-medium sm:text-foreground/85">
                  {professor.title}, {professor.department}
                </p>
                <p className="hidden text-xs text-muted-foreground sm:block sm:mt-0.5 sm:text-sm">
                  {professor.role}
                </p>

                {professor.bio && (
                  <p className="mt-3.5 hidden line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:block">
                    {professor.bio}
                  </p>
                )}

                {professor.areasOfInterest && professor.areasOfInterest.length > 0 && (
                  <div className="mt-4 hidden flex-wrap items-center gap-2 sm:flex">
                    {professor.areasOfInterest.map((area: string) => (
                      <span
                        key={area}
                        className="rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <ResearcherRail
            members={(() => {
              // PhD students only. The PI heads this section directly above,
              // and the postdocs / MSc / undergrads have their own rows on the
              // people page.
              const piName = professor?.name ?? "";
              const phds = (contentData.team?.sections ?? [])
                .filter((s: any) => s.role === "PhD Students")
                .flatMap((s: any) =>
                  (s.members ?? [])
                    .filter((m: any) => m.name !== piName)
                    .map((m: any) => ({
                      name: m.name,
                      // Singular: the row names one person, while the section
                      // heading on /people stays plural.
                      role: contentData.latestPublications?.railPhdRoleLabel ?? "PhD Student",
                      // Addresses this person's row on /people. Minted here with
                      // the same helper the page uses, so the two can't drift.
                      anchor: memberAnchor(s.role, m.name),
                      imagePath: m.imagePath,
                    })),
                );

              return phds as RailMember[];
            })()}
            label={contentData.latestPublications?.researchersLabel ?? "Researchers"}
            ctaLabel={contentData.latestPublications?.allMembersLabel ?? "View all people"}
            ctaHref="/people"
          />
        </div>
      </section>

      {/* LATEST RESEARCH + TEAM */}
      {(() => {
        const years = (contentData.publications.years ?? {}) as Record<string, any>;
        const yearKeys = Object.keys(years).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

        // Pool the two most recent years rather than just the newest one. A
        // single new year is often nearly empty — 2027 holds one paper — so
        // reading from it alone left this section looking almost blank.
        const featuredYears = yearKeys.slice(0, 2);
        if (featuredYears.length === 0) return null;

        const all: any[] = featuredYears.flatMap((year) => {
          const bucket = years[year] ?? {};
          return [
            ...(bucket.journalArticles ?? []),
            ...(bucket.conferenceProceedings ?? []),
            ...(bucket.extendedAbstracts ?? []),
            ...(bucket.researchArtifacts ?? []),
          ];
        });
        if (all.length === 0) return null;

        const maxShow = contentData.latestPublications?.maxToShow ?? 4;
        const latest = all.slice(0, maxShow);
        const yearLabel =
          featuredYears.length > 1
            ? `${featuredYears[0]} – ${featuredYears.at(-1)}`
            : featuredYears[0];

        return (
          <section data-section="research" data-section-label="Research" className="border-b border-border">
            <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
              <div>
                  {/* Research domains — leads the section; the reading it
                      sets up is what the paper list below then answers. */}
          <section
                    id="research-domains"
                    aria-labelledby="research-domains-heading"
                    className="scroll-mt-24"
                  >
                    <div className="mb-8 border-b border-border pb-4">
                      <h2
                        id="research-domains-heading"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"
                      >
                        <Cpu className="size-3.5 text-primary" />
                        {researchDomains.sectionLabel}
                  </h2>
                    </div>

                    <ul className="grid gap-x-12 sm:grid-cols-2 md:gap-x-16">
                      {researchDomains.items.map((item: any) => {
                        const Icon = iconMap[item.icon as IconName] ?? iconMap.Globe;
                        return (
                          <li
                            key={item.title}
                            className="border-b border-border py-7 sm:py-8"
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
                  </section>

                  {/* Latest research */}
                  <section
                    id="latest-research"
                    aria-labelledby="latest-research-heading"
                    className="mt-16 scroll-mt-24"
                  >
                    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-border pb-4">
                      <h2
                        id="latest-research-heading"
                        className="text-sm font-semibold text-foreground"
                      >
                        {contentData.latestPublications?.eyebrow}
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="text-sm font-medium text-primary">
                          {yearLabel}
                        </span>
                        <span aria-hidden className="h-3 w-px bg-border" />
                <Link
                  href={contentData.latestPublications?.viewAllHref ?? "/publications"}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                          {contentData.latestPublications?.viewAllLabel}
                          <ArrowRight className="size-3" />
                </Link>
                      </div>
              </div>

                    <div className="grid gap-px bg-border sm:grid-cols-2">
                {latest.map((pub: any, i: number) => (
                  <article
                    key={pub.id ?? `latest-${i}`}
                          className="bg-background p-6 transition-colors hover:bg-muted/20 sm:p-7"
                        >
                        {pub.award && (
                            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/8 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                              <svg viewBox="0 0 24 24" className="size-2.5 fill-accent" aria-hidden>
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            {pub.award}
                          </span>
                        )}
                          <h3 className="text-[16px] font-medium leading-snug text-foreground">
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
                            <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground line-clamp-1">
                          {pub.authors}
                        </p>
                      )}
                          {pub.venue && (
                            <p className="mt-1.5 text-sm font-medium text-primary/80">
                              {pub.venue}
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  </section>
              </div>
            </div>
          </section>
        );
      })()}

    </main>
  );
}
