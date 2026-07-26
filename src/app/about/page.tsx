import Link from "next/link";
import {
  ArrowUpRight,
} from "lucide-react";
import type { Metadata } from "next";

import contentData from "../../../public/config/content.json";

export const metadata: Metadata = {
  title: contentData.aboutPage.pageTitle,
  description: contentData.aboutPage.subhead,
};

export default function AboutPage() {
  const { aboutPage, researchLabs, campuses } = contentData;

  return (
    <main className="bg-background">
      {/* Approach */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-6 flex items-baseline justify-between gap-6 border-b border-border pb-4">
            <h2 className="type-subhead text-foreground">
              {aboutPage.approachTitle}
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {`${aboutPage.approachItems?.length ?? 0} ${(aboutPage.approachItems?.length ?? 0) === 1 ? aboutPage.methodsCountSingular : aboutPage.methodsCountPlural}`}
            </span>
          </div>

          <p className="text-lg leading-relaxed mb-12 max-w-3xl text-pretty text-muted-foreground">
            {aboutPage.approachBody}
          </p>

          {aboutPage.approachItems && aboutPage.approachItems.length > 0 && (
            <ol className="border-t border-border">
              {aboutPage.approachItems.map((item, i) => (
                <li
                  key={`${item.title}-${i}`}
                  className="grid grid-cols-12 gap-x-6 gap-y-2 border-b border-border py-7 sm:py-8"
                >
                  <div className="col-span-12 sm:col-span-3">
                    <h3 className="text-lg font-medium text-foreground">
                      {item.title}
                    </h3>
                  </div>
                  <p className="col-span-12 max-w-prose text-lg leading-relaxed text-muted-foreground sm:col-span-9">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Related links — two parallel index columns, hairline rows */}
      <section>
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-10 border-b border-border pb-4">
            <h2 className="type-subhead text-foreground">
              {aboutPage.affiliationsEyebrow}
            </h2>
          </div>

          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <h3 className="mb-4 type-body font-medium text-foreground">
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
                        className="group inline-flex flex-1 items-baseline justify-between gap-2 type-body text-foreground transition-colors hover:text-primary"
                      >
                        <span>{item.name}</span>
                        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    ) : (
                      <span className="flex-1 type-body text-muted-foreground">
                        {item.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 type-body font-medium text-foreground">
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
                      className="group inline-flex flex-1 items-baseline justify-between gap-2 type-body text-foreground transition-colors hover:text-primary"
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
