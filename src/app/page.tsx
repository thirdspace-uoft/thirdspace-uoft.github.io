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

            {/* Optical centring. The grid box-centres these columns, but their
                ink doesn't centre with them: the h1's cap-height sits high in
                its 60px line box, so its visible text starts lower than the box
                top. Measured on real glyph bounds, the top gap came out ~7px
                wider than the bottom. The 2px lift below equalises them. Inline
                style rather than a `translate-y-*` utility because the negative
                fractional variant isn't emitted by this Tailwind build. Applied
                via a media query so the stacked layout below `lg` is untouched. */}
            <aside className="space-y-5 lg:col-span-4 lg:[translate:0_-2px]">
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
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-14">
            {/* PI — portrait and credentials centred as one block */}
            <div className="lg:col-span-5">
              <div className="mx-auto flex max-w-md flex-col items-center gap-7 text-center lg:max-w-none lg:flex-row lg:items-center lg:gap-9 lg:text-left">
                <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-full sm:h-48 sm:w-48">
                  <Image
                    src={getImageUrl(professor.imagePath)}
                    alt={professor.name}
                    fill
                    sizes="192px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <a
                    href={professor.website}
                    target="_blank"
                    rel="noreferrer"
                    className="group/name inline-flex items-start gap-1.5 text-[30px] font-semibold leading-tight tracking-tight text-foreground transition-colors hover:text-primary lg:inline"
                  >
                    <span>{professor.name}</span>
                    <ArrowUpRight className="mt-1 size-5 shrink-0 text-primary lg:ml-1.5 lg:mt-0 lg:inline" />
                  </a>
                  <p className="mt-3 font-mono text-[13px] uppercase tracking-[0.2em] text-primary">
                    {home.groupOverviewFigLabel}
                  </p>
                  <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">
                    <span className="text-foreground">
                      {professor.title}
                    </span>
                    , {professor.institution}. {professor.role}.
                  </p>
                </div>
              </div>
            </div>

            {/* Focus areas — three columns, vertically centred on the PI block */}
            <div className="lg:col-span-6 lg:col-start-7">
              <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
                {groupOverview.focusCards.map((item) => {
                  const Icon =
                    iconMap[item.icon as keyof typeof iconMap] || Globe;

                  return (
                    <li key={item.title}>
                      <Icon className="size-4 text-primary" />
                      <h3 className="mt-3 text-[17px] font-medium leading-snug text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
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
                      // Singular: the tile names one person, while the section
                      // heading on /people stays plural.
                      role: contentData.latestPublications?.railPhdRoleLabel ?? "PhD Student",
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
              <div>
                  {/* Latest research */}
                  <section
                    id="latest-research"
                    aria-labelledby="latest-research-heading"
                    className="scroll-mt-24"
                  >
                    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-border pb-4">
                      <h2
                        id="latest-research-heading"
                        className="font-mono text-[14px] uppercase tracking-[0.22em] text-foreground"
                      >
                        {contentData.latestPublications?.eyebrow}
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="font-mono text-[14px] uppercase tracking-[0.22em] text-primary">
                          {latestYear}
                        </span>
                        <span aria-hidden className="h-3 w-px bg-border" />
                        <Link
                          href={contentData.latestPublications?.viewAllHref ?? "/publications"}
                          className="inline-flex items-center gap-1.5 font-mono text-[14px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
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
                  </section>

                  {/* Research domains */}
                  <section
                    id="research-domains"
                    aria-labelledby="research-domains-heading"
                    className="mt-16 scroll-mt-24"
                  >
                    <div className="mb-8 border-b border-border pb-4">
                      <h2
                        id="research-domains-heading"
                        className="inline-flex items-center gap-2 font-mono text-[14px] uppercase tracking-[0.22em] text-foreground"
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
              </div>
            </div>
          </section>
        );
      })()}

    </main>
  );
}
