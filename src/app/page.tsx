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
import { pad2, eyebrow, figLabel } from "@/lib/section-numbering";

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
            <span className="hidden h-3 w-px bg-border sm:block" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {`${home.metaVolPrefix} ${home.metaVolNumber} · ${home.metaVolYear}`}
            </span>
          </div>
          {/* Headline + lede */}
          <div className="grid gap-12 md:gap-16 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-8">
              <h1 className="font-heading text-[clamp(2.5rem,5.4vw,5rem)] font-medium leading-[1.02] tracking-[-0.035em] text-foreground">
                <span className="block">Utilizing human values,</span>
                <span className="block italic text-muted-foreground">
                  situated knowledge,
                </span>
                <span className="block">and lived experiences.</span>
              </h1>
            </div>

            <aside className="space-y-8 lg:col-span-4 lg:pt-3">
              <p className="text-pretty text-base leading-7 text-muted-foreground">
                {hero.subParagraph}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="#about-group"
                  className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
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
              <figcaption className="mt-3 flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <span>{figLabel(hero.figPrefix, 1)} · {hero.groupPhotoAlt}</span>
                <span>{hero.locationChip}</span>
              </figcaption>
            </div>

            <div className="md:col-span-5 md:pl-2 md:pt-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                {hero.researchPostureLabel}
              </span>
              <p className="mt-3 font-heading text-2xl font-medium leading-snug tracking-[-0.025em] text-foreground sm:text-3xl">
                {hero.researchPostureBody}
              </p>
              <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-6">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {hero.methodsLabel}
                  </dt>
                  <dd className="mt-2 text-sm font-medium leading-snug text-foreground">
                    {hero.methodsValue}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {hero.focusLabel}
                  </dt>
                  <dd className="mt-2 text-sm font-medium leading-snug text-foreground">
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
      {/* GROUP OVERVIEW — wide editorial block, hairline-bordered, professor profile alongside */}
      <section
        id="about-group"
        className="relative scroll-mt-24 px-6 py-14 md:py-20 border-b border-border"
      >
        <div className="relative mx-auto w-full max-w-[1232px]">
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-card/85 shadow-2xl shadow-primary/10 backdrop-blur">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,transparent_54%,var(--accent)_54%,transparent_55%)] opacity-25" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-full bg-gradient-to-t from-primary/5 to-transparent" />
            <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full border border-primary/10 bg-primary/5" />
            <div className="grid gap-0 items-stretch lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="relative p-6 md:p-10 lg:p-12">
                <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      {eyebrow(1, groupOverview.eyebrow)}
                    </span>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground md:text-3xl">
                      {groupOverview.headline}
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10" />
                    {groupOverview.locationChip}
                  </span>
                </div>

                <p className="text-pretty text-base leading-8 text-foreground/90 md:text-lg md:leading-9">
                  {groupOverview.body.split(professor.name)[0]}
                  <a
                    href={professor.website}
                    target="_blank"
                    rel="noreferrer"
                    className="group/ishtiaque relative inline-flex items-baseline font-semibold text-primary underline decoration-accent/70 decoration-2 underline-offset-4 transition-colors after:absolute after:left-0 after:top-full after:h-8 after:w-72 after:content-[''] hover:text-primary/80"
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
                          <span className="block text-sm font-semibold text-foreground">
                            {professor.name}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                            {professor.title}
                            <br />
                            {professor.department}
                            <br />
                            {professor.institution}
                            <br />
                            {professor.role}
                          </span>
                        </span>
                        <MoveUpRight className="h-4 w-4 text-primary" />
                      </span>
                    </span>
                  </a>
                  {groupOverview.body.split(professor.name)[1]}
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {groupOverview.focusCards.map((item, index) => {
                    const Icon =
                      iconMap[item.icon as keyof typeof iconMap] || Globe;

                    return (
                      <div
                        key={item.title}
                        className="group/focus relative min-h-36 overflow-hidden rounded-[1.4rem] border border-primary/10 bg-background/70 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:bg-card hover:shadow-xl hover:shadow-primary/10"
                      >
                        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/5 transition-transform duration-500 group-hover/focus:scale-125" />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-40" />

                        <div className="relative flex h-full flex-col justify-between gap-6">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/10 bg-primary/8 text-primary transition-colors group-hover/focus:bg-primary group-hover/focus:text-primary-foreground">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="rounded-full border border-border bg-muted/70 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
                              {pad2(index + 1)} / {item.label}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold leading-snug tracking-[-0.02em] text-foreground">
                              {item.title}
                            </h3>
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <a
                href={professor.website}
                target="_blank"
                rel="noreferrer"
                className="group/profile relative min-h-[360px] overflow-hidden rounded-b-[2rem] border-t border-border bg-primary text-primary-foreground lg:rounded-bl-none lg:rounded-r-[2rem] lg:border-l lg:border-t-0"
                aria-label={`Visit ${professor.name}'s website`}
              >
                <Image
                  src={getAssetPath(professor.imagePath)}
                  alt={professor.name}
                  fill
                  sizes="(min-width: 1024px) 340px, 100vw"
                  className="object-cover opacity-80 transition duration-700 group-hover/profile:scale-105 group-hover/profile:opacity-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/45 to-transparent" />
                <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.22em] backdrop-blur">
                  {groupOverview.glanceLabel}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="rounded-[1.4rem] border border-white/15 bg-white/12 p-4 backdrop-blur-md transition-transform duration-300 group-hover/profile:-translate-y-1">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-primary-foreground/70">
                          <span>{figLabel(hero.figPrefix, 2)} · {home.groupOverviewFigLabel}</span>
                        </p>
                        <p className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                          {professor.name}
                        </p>
                      </div>
                      <MoveUpRight className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-primary-foreground/78">
                      {professor.department}, {professor.institution}.<br />
                      {professor.role}.
                    </p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* ABOUT THE GROUP — quote, hairline-left accent */}
      {about && (
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Quote className="size-4 text-primary" />
              <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {eyebrow(2, about.title)}
              </h2>
            </div>
            <p className="mt-10 max-w-3xl border-l border-primary pl-6 font-heading text-2xl font-medium leading-snug tracking-[-0.025em] text-foreground sm:text-3xl">
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
                {eyebrow(3, researchDomains.sectionLabel)}
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
                  className="group/dom border-b border-border py-7 first:border-t first:border-border sm:py-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Icon className="mt-1 size-4 shrink-0 text-primary" />
                      <div>
                        <h3 className="font-heading text-lg font-medium tracking-[-0.02em] text-foreground">
                          {item.title}
                        </h3>
                        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      {pad2(index + 1)}
                    </span>
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
              {eyebrow(4, homePillars.eyebrow)}
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
                  <div className="flex items-center justify-between">
                    <Icon className="size-4 text-primary" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      {pad2(index + 1)}
                    </span>
                  </div>
                  <h3 className="mt-10 font-heading text-xl font-medium tracking-[-0.02em] text-foreground">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
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
