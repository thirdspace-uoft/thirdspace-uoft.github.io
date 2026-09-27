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
import { ResearcherRail, type RailMember } from "@/components/researcher-rail";

const contentData = getContent();
const {
  hero,
  home,
  groupOverview,
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
      {/* HERO — editorial split, generous whitespace */}
      <section data-section="hero" data-section-label="Home" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 pt-10 pb-12 sm:px-8 sm:pt-14 sm:pb-16">
          {/* Headline + lede */}
          <div className="grid gap-8 md:gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
            <div className="min-w-0 lg:col-span-8">
              <h1 className="type-display text-foreground">
                <span className="block">{hero.headlineLine1}</span>
                <span className="block font-semibold text-muted-foreground">
                  {hero.headlineLine2}
                </span>
                <span className="block">{hero.headlineLine3}</span>
              </h1>
            </div>

            <aside className="space-y-5 lg:col-span-4">
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
                  href="/people"
                  className="inline-flex items-center gap-2 px-1 py-2.5 font-mono text-[17px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {hero.secondaryActionText}
                  <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </aside>
          </div>

          {/* Plate — single photograph, no chrome */}
          <figure className="mt-10 sm:mt-12">
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={getImageUrl(hero.groupPhotoPath)}
                alt={hero.groupPhotoAlt}
                fill
                priority
                sizes="100vw"
                className="object-cover grayscale-[8%]"
              />
            </div>
          </figure>
        </div>
      </section>

      {/* GROUP OVERVIEW — PI card + focus cards, then the researcher rail */}
      <section id="about-group" data-section="people" data-section-label="People" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
            {/* PI — portrait and credentials centred as one block */}
            <div className="lg:col-span-5">
              <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center lg:max-w-none lg:flex-row lg:items-start lg:gap-7 lg:text-left">
                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full sm:h-36 sm:w-36">
                  <Image
                    src={getImageUrl(professor.imagePath)}
                    alt={professor.name}
                    fill
                    sizes="144px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <a
                    href={professor.website}
                    target="_blank"
                    rel="noreferrer"
                    className="group/name inline-flex items-start gap-1 text-[22px] font-semibold leading-tight tracking-tight text-foreground transition-colors hover:text-primary lg:inline"
                  >
                    <span>{professor.name}</span>
                    <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-primary lg:ml-1 lg:mt-0 lg:inline" />
                  </a>
                  <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.2em] text-primary">
                    {home.groupOverviewFigLabel}
                  </p>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                    <span className="text-foreground">
                      {professor.title}
                    </span>
                    , {professor.institution}. {professor.role}.
                  </p>
                </div>
              </div>
            </div>

            {/* Focus areas — full-width hairline rows, not cramped cards */}
            <div className="lg:col-span-6 lg:col-start-7">
              <ul>
                {groupOverview.focusCards.map((item) => {
                  const Icon =
                    iconMap[item.icon as keyof typeof iconMap] || Globe;

                  return (
                    <li
                      key={item.title}
                      className="flex gap-4 border-t border-border py-4 first:border-t-0 first:pt-0 lg:py-5"
                    >
                      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <h3 className="type-body font-medium leading-snug text-foreground">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <ResearcherRail
            members={(() => {
              // PhD students only. The PI heads this section directly above,
              // and the postdocs / undergrads / collaborators have their own
              // rows on the people page.
              const piName = professor?.name ?? "";
              const phds = (contentData.team?.sections ?? [])
                .filter((s: any) => s.role === "PhD Students")
                .flatMap((s: any) =>
                  (s.members ?? [])
                    .filter((m: any) => m.name !== piName)
                    .map((m: any) => ({
                      name: m.name,
                      role: s.role,
                      imagePath: m.imagePath,
                      bio: m.bio,
                      areasOfInterest: m.areasOfInterest,
                      website: m.links?.find((l: any) => l.url)?.url,
                      websiteLabel: m.links?.find((l: any) => l.url)?.label,
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

        return (
          <section data-section="research" data-section-label="Research" className="border-b border-border">
            <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
              <div className="mb-10 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[14px] uppercase tracking-[0.22em] text-muted-foreground">
                    {contentData.latestPublications?.eyebrow}
                  </span>
                  <span className="h-3 w-px bg-border" />
                  <span className="font-mono text-[14px] uppercase tracking-[0.22em] text-primary">
                    {latestYear}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Link
                    href={contentData.latestPublications?.viewAllHref ?? "/publications"}
                    className="inline-flex items-center gap-1.5 font-mono text-[14px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {contentData.latestPublications?.viewAllLabel}
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>

              {/* Publications — full width now that the team rail moved out */}
              <div className="grid gap-px bg-border sm:grid-cols-2">
                    {latest.map((pub: any, i: number) => (
                      <article
                        key={pub.id ?? `latest-${i}`}
                        className="bg-background p-6 transition-colors hover:bg-muted/20 sm:p-7"
                      >
                        {pub.award && (
                          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/8 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.15em] text-accent-foreground">
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
                          <p className="mt-1.5 font-mono text-[14px] uppercase tracking-[0.1em] text-primary/80">
                            {pub.venue}
                          </p>
                        )}
                      </article>
                    ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* RESEARCH DOMAINS — clean 2-col index, hairline rules, no bento */}
      <section data-section="domains" data-section-label="Domains" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="mb-10 flex items-baseline justify-between gap-6 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Cpu className="size-3.5 text-primary" />
              <h2 className="font-mono text-[14px] uppercase tracking-[0.22em] text-muted-foreground">
                {researchDomains.sectionLabel}
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 font-mono text-[14px] uppercase tracking-[0.22em] text-muted-foreground">
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
    </main>
  );
}
