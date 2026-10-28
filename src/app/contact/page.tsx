import { notFound } from "next/navigation";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";

import { RichText } from "@/components/research/rich-text";
import { XIcon } from "@/components/x-icon";
import { getContent } from "@/lib/content";
import { getContact } from "@/lib/contact";
import { getHiring } from "@/lib/hiring";
import { HiringSection } from "@/components/hiring/hiring-section";

const contact = getContact();
const hiring = getHiring();
// The same address and channels the footer shows.
const { location, socials } = getContent();

export const metadata = {
  title: contact.page?.metaTitle,
  description: contact.page?.metaDescription,
};

const linkClass =
  "inline-flex items-center gap-2 text-foreground underline decoration-primary/40 decoration-1 underline-offset-[5px] transition-colors hover:text-primary hover:decoration-primary";

export default function ContactPage() {
  // Turned off in the admin: the page does not exist (and the nav link is hidden).
  if (!contact.enabled) notFound();

  const labels = contact.labels ?? {};
  const mapsQuery = location.mapsQuery;

  return (
    <main className="bg-background">
      {/* No bottom border: the hiring section draws its own top one, and the footer its own divider. */}
      <section data-section="contact" data-section-label={contact.navLabel}>
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-12 lg:gap-12 lg:py-16">
          <div className="lg:col-span-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem] lg:leading-[1.14]">
              {contact.page?.title}
            </h1>
            <RichText
              text={contact.page?.intro}
              className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            />
          </div>

          {/* Location + Connect: top right on large screens, under the intro on small ones. */}
          <aside className="space-y-7 border-t border-border pt-8 text-sm lg:col-span-4 lg:border-t-0 lg:border-l lg:pt-1 lg:pl-8">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-foreground">
                <MapPin className="size-4 text-primary" aria-hidden="true" />
                {location.locationHeading}
              </h2>
              <div className="mt-2.5 space-y-0.5 leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">{location.institution}</p>
                <p>{location.street}</p>
                <p>{location.cityCountry}</p>
              </div>
              {mapsQuery && labels.openMapLabel && (
                <a
                  href={`https://maps.google.com/?q=${mapsQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`${linkClass} mt-3 font-medium`}
                >
                  {labels.openMapLabel}
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              )}
            </div>

            {(socials.email || socials.xUrl) && (
              <div>
                <h2 className="text-base font-bold tracking-tight text-foreground">{labels.connectHeading}</h2>
                <ul className="mt-2.5 space-y-2.5">
                  {socials.email && (
                    <li>
                      <a href={`mailto:${socials.email}`} className={`${linkClass} break-all`}>
                        <Mail className="size-4 shrink-0 text-primary" aria-hidden="true" />
                        <span>{socials.email}</span>
                      </a>
                    </li>
                  )}
                  {socials.xUrl && (
                    <li>
                      <a href={socials.xUrl} target="_blank" rel="noreferrer" className={linkClass}>
                        <XIcon className="size-3.5 shrink-0 text-primary" />
                        <span>{socials.xHandle || socials.xDesktopAriaLabel}</span>
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>

      {hiring.enabled && <HiringSection hiring={hiring} />}
    </main>
  );
}
