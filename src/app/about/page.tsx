import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  MapPin,
  MoveUpRight,
  Network,
  Orbit,
  Quote,
  Users,
} from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { getAssetPath } from "@/lib/utils";
import { pad2, eyebrow } from "@/lib/section-numbering";
import contentData from "../../../public/config/content.json";

export const metadata: Metadata = {
  title: contentData.aboutPage.pageTitle,
  description: contentData.aboutPage.subhead,
};

export default function AboutPage() {
  const { aboutPage, researchLabs, campuses } = contentData;
  const aboutHero = {
    badge: aboutPage.heroBadge,
    locationChip: aboutPage.heroLocationChip,
    headlineLine1: aboutPage.heroHeadlineLine1,
    headlineLine2: aboutPage.heroHeadlineLine2,
    headlineLine3: aboutPage.heroHeadlineLine3,
    subParagraph: aboutPage.heroSubParagraph,
    primaryActionText: aboutPage.heroPrimaryActionText,
    researchPostureLabel: aboutPage.heroResearchPostureLabel,
    researchPostureBody: aboutPage.heroResearchPostureBody,
    methodsLabel: aboutPage.heroMethodsLabel,
    methodsValue: aboutPage.heroMethodsValue,
    focusLabel: aboutPage.heroFocusLabel,
    focusValue: aboutPage.heroFocusValue,
    groupPhotoPath: aboutPage.heroGroupPhotoPath,
    groupPhotoAlt: aboutPage.heroGroupPhotoAlt,
  };

  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/4 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/8 blur-[100px]" />
          <div className="absolute left-1/4 top-1/2 h-72 w-72 rounded-full bg-accent/8 blur-3xl" />
          <div className="absolute right-1/4 top-1/3 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-6 py-14 md:py-20">
          <div className="grid items-stretch gap-6 sm:gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,300px)] lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="relative min-w-0 overflow-hidden rounded-[2rem] border border-primary/15 bg-card/75 p-6 shadow-2xl shadow-primary/10 backdrop-blur sm:p-8 md:p-7 lg:p-10 xl:p-12">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,transparent_54%,var(--accent)_54%,transparent_55%)] opacity-25" />
              <div className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full border border-primary/10 bg-primary/5" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-full bg-gradient-to-t from-primary/5 to-transparent" />

              <div className="relative flex flex-col gap-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3 py-1.5 text-[0.65rem] font-mono uppercase tracking-[0.26em] text-primary shadow-sm">
                    <Orbit className="h-3.5 w-3.5" />
                    {aboutHero.badge}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-[0.65rem] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {aboutHero.locationChip}
                  </span>
                </div>

                <div className="max-w-5xl space-y-3 tracking-[-0.055em] text-foreground">
                  <h1 className="text-balance text-5xl font-semibold leading-[0.86] sm:text-6xl md:text-5xl lg:text-6xl xl:text-[6.8rem]">
                    {aboutHero.headlineLine1}
                  </h1>
                  <h2 className="text-balance text-4xl font-semibold leading-[0.9] text-foreground/88 sm:text-5xl md:text-4xl lg:text-5xl xl:text-[5.2rem]">
                    {aboutHero.headlineLine2}
                  </h2>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <span className="h-px w-24 bg-primary/35" />
                    <h3 className="text-balance text-3xl font-semibold leading-tight text-primary sm:text-4xl md:text-3xl lg:text-4xl xl:text-5xl">
                      {aboutHero.headlineLine3}
                    </h3>
                  </div>
                </div>

                <div className="grid gap-5 border-t border-border/80 pt-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <p className="max-w-2xl text-pretty text-sm leading-7 text-muted-foreground md:text-base">
                    {aboutHero.subParagraph}
                  </p>
                  <Button
                    asChild
                    className="h-12 w-fit rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                  >
                    <a href="#mission">
                      {aboutHero.primaryActionText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <aside className="relative grid auto-rows-min gap-4 lg:pb-0">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-2xl shadow-primary/10">
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={getAssetPath(aboutHero.groupPhotoPath)}
                    alt={aboutHero.groupPhotoAlt}
                    fill
                    sizes="(min-width: 1024px) 380px, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/85 via-primary/40 to-transparent p-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white backdrop-blur">
                    <Users className="h-3.5 w-3.5" />
                    {aboutHero.locationChip}
                  </span>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border bg-primary p-5 text-primary-foreground shadow-2xl shadow-primary/20">
                <div className="mb-10 flex items-center justify-between text-primary-foreground/70">
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.24em]">
                    {aboutHero.researchPostureLabel}
                  </span>
                  <Network className="h-4 w-4" />
                </div>
                <p className="text-pretty text-2xl font-medium leading-tight tracking-[-0.04em]">
                  {aboutHero.researchPostureBody}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group rounded-[1.5rem] border border-border bg-card p-4 shadow-sm transition-transform hover:-translate-y-1">
                  <BookOpen className="mb-8 h-5 w-5 text-primary" />
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
                    {aboutHero.methodsLabel}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-snug text-foreground">
                    {aboutHero.methodsValue}
                  </p>
                </div>
                <div className="group rounded-[1.5rem] border border-accent/60 bg-accent/70 p-4 shadow-sm transition-transform hover:-translate-y-1">
                  <MoveUpRight className="mb-8 h-5 w-5 text-accent-foreground" />
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent-foreground/70">
                    {aboutHero.focusLabel}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-snug text-accent-foreground">
                    {aboutHero.focusValue}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Editorial header (existing) */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 pt-16 pb-16 sm:px-8 sm:pt-24 sm:pb-20">
          <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border pb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {aboutPage.eyebrow}
            </span>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {aboutPage.metaVolLine}
            </span>
          </div>

          <div className="grid gap-10 lg:grid-cols-12">
            <h1 className="font-heading text-[clamp(2.25rem,5vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.035em] text-foreground lg:col-span-8">
              {aboutPage.headline}
            </h1>
            <p className="max-w-prose text-pretty text-base leading-7 text-muted-foreground lg:col-span-4 lg:pt-3">
              {aboutPage.subhead}
            </p>
          </div>
        </div>
      </section>

      {/* Mission — numbered, hairline-underlined */}
      <section id="mission" className="scroll-mt-24 border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-6 flex items-baseline justify-between gap-6 border-b border-border pb-4">
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {pad2(1)}
              </span>
              <h2 className="font-heading text-2xl font-medium tracking-[-0.025em] text-foreground sm:text-3xl">
                {aboutPage.missionTitle}
              </h2>
            </div>
          </div>
          <div className="grid gap-10 lg:grid-cols-12">
            <p className="max-w-prose border-l border-primary pl-6 font-heading text-xl font-medium leading-snug tracking-[-0.02em] text-foreground sm:text-2xl lg:col-span-7 lg:col-start-2">
              {aboutPage.missionBody}
            </p>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-6 flex items-baseline justify-between gap-6 border-b border-border pb-4">
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {pad2(2)}
              </span>
              <h2 className="font-heading text-2xl font-medium tracking-[-0.025em] text-foreground sm:text-3xl">
                {aboutPage.approachTitle}
              </h2>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {`${aboutPage.approachItems?.length ?? 0} ${(aboutPage.approachItems?.length ?? 0) === 1 ? aboutPage.methodsCountSingular : aboutPage.methodsCountPlural}`}
            </span>
          </div>

          <p className="mb-12 max-w-3xl text-pretty text-base leading-7 text-muted-foreground">
            {aboutPage.approachBody}
          </p>

          {aboutPage.approachItems && aboutPage.approachItems.length > 0 && (
            <ol className="border-t border-border">
              {aboutPage.approachItems.map((item, i) => (
                <li
                  key={`${item.title}-${i}`}
                  className="grid grid-cols-12 gap-x-6 gap-y-2 border-b border-border py-7 sm:py-8"
                >
                  <span className="col-span-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:col-span-1">
                    {pad2(i + 1)}
                  </span>
                  <div className="col-span-10 sm:col-span-3">
                    <h3 className="font-heading text-base font-medium tracking-[-0.015em] text-foreground">
                      {item.title}
                    </h3>
                  </div>
                  <p className="col-span-12 max-w-prose text-sm leading-6 text-muted-foreground sm:col-span-8">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Story */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-6 flex items-baseline justify-between gap-6 border-b border-border pb-4">
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {pad2(3)}
              </span>
              <h2 className="font-heading text-2xl font-medium tracking-[-0.025em] text-foreground sm:text-3xl">
                {aboutPage.storyTitle}
              </h2>
            </div>
          </div>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <div className="flex items-center gap-2 text-primary">
                <Quote className="size-4" />
                <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
                  {aboutPage.fieldNotesLabel}
                </span>
              </div>
            </div>
            <p className="max-w-3xl whitespace-pre-line text-pretty text-base leading-8 text-foreground lg:col-span-9">
              {aboutPage.storyBody}
            </p>
          </div>
          <div className="mt-12">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground transition-colors hover:text-primary"
            >
              {aboutPage.getInTouchLabel}
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Related links — two parallel index columns, hairline rows */}
      <section>
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-10 border-b border-border pb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {`${pad2(4)} · ${aboutPage.affiliationsEyebrow}`}
            </span>
          </div>

          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <h3 className="mb-4 font-heading text-base font-medium tracking-[-0.015em] text-foreground">
                {researchLabs.title}
              </h3>
              <ul className="border-t border-border">
                {researchLabs.items.map((item, i) => (
                  <li
                    key={`${item.name}-${i}`}
                    className="flex items-center justify-between gap-3 border-b border-border py-3"
                  >
                    {item.url ? (
                      <Link
                        href={item.url}
                        target={item.isExternal ? "_blank" : undefined}
                        rel={item.isExternal ? "noreferrer" : undefined}
                        className="group inline-flex flex-1 items-baseline justify-between gap-2 text-sm text-foreground transition-colors hover:text-primary"
                      >
                        <span>{item.name}</span>
                        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    ) : (
                      <span className="flex-1 text-sm text-muted-foreground">
                        {item.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-heading text-base font-medium tracking-[-0.015em] text-foreground">
                {campuses.title}
              </h3>
              <ul className="border-t border-border">
                {campuses.items.map((campus, i) => (
                  <li
                    key={`${campus.name}-${i}`}
                    className="flex items-center justify-between gap-3 border-b border-border py-3"
                  >
                    <Link
                      href={campus.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex flex-1 items-baseline justify-between gap-2 text-sm text-foreground transition-colors hover:text-primary"
                    >
                      <span>{campus.name}</span>
                      <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
