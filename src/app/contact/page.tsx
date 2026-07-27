import Link from "next/link";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { getContent } from "@/lib/content";

const contentData = getContent();
const { contact, location, socials, professor } = contentData;

export const metadata = {
  title: contact.pageTitle,
  description: contact.headline,
};

export default function ContactPage() {
  return (
    <main className="bg-background">
      {/* Hero */}
      <section data-section="contact" data-section-label="Contact" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 pt-16 pb-16 sm:px-8 sm:pt-24 sm:pb-20">
          <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border pb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {contact.eyebrow}
            </span>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {contact.responseTime}
            </span>
          </div>

          <div className="grid gap-10 lg:grid-cols-12">
            <h1 className="type-display text-foreground lg:col-span-8">
              {contact.headline}
            </h1>
            <p className="text-lg leading-relaxed max-w-prose text-pretty text-muted-foreground lg:col-span-4 lg:pt-3">
              {contact.body}
            </p>
          </div>
        </div>
      </section>

      {/* Contact index — two hairline rows */}
      <section data-section="contact-channels" data-section-label="Channels" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-6 flex items-baseline justify-between gap-6 border-b border-border pb-4">
            <h2 className="type-subhead text-foreground">
              {contact.sections.directChannels}
            </h2>
          </div>

          <ul className="border-t border-border">
            {/* Email */}
            <li className="grid grid-cols-12 items-baseline gap-x-6 gap-y-3 border-b border-border py-7 sm:py-8">
              <div className="col-span-12 flex items-center gap-3 sm:col-span-3">
                <Mail className="size-4 shrink-0 text-primary" />
                <h3 className="text-lg font-medium text-foreground">
                  {contact.emailLabel}
                </h3>
              </div>
              <div className="col-span-12 sm:col-span-9">
                <Link
                  href={`mailto:${socials.email}`}
                  className="inline-flex items-center gap-1.5 text-lg text-foreground underline decoration-primary/40 decoration-1 underline-offset-[5px] transition-colors hover:decoration-primary"
                >
                  {socials.email}
                </Link>
              </div>
            </li>

            {/* Office */}
            <li className="grid grid-cols-12 items-baseline gap-x-6 gap-y-3 border-b border-border py-7 sm:py-8">
              <div className="col-span-12 flex items-center gap-3 sm:col-span-3">
                <MapPin className="size-4 shrink-0 text-primary" />
                <h3 className="text-lg font-medium text-foreground">
                  {contact.rows.office.label}
                </h3>
              </div>
              <div className="col-span-12 sm:col-span-9">
                <p className="font-medium text-foreground">{location.institution}</p>
                <p className="mt-1 text-lg leading-relaxed text-muted-foreground">
                  {location.title}
                  <br />
                  {location.street}
                  <br />
                  {location.cityCountry}
                </p>
                <HoverCard openDelay={100} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <Link
                      href={`https://maps.google.com/?q=${location.mapsQuery}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 type-meta uppercase tracking-[0.22em] text-primary underline decoration-primary/40 decoration-1 underline-offset-[5px] transition-colors hover:decoration-primary"
                    >
                      {location.footerMapLabel}
                      <ArrowUpRight className="size-3" />
                    </Link>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="top"
                    align="end"
                    sideOffset={12}
                    className="w-[280px] sm:w-[320px] p-0 overflow-hidden rounded-xl bg-card border border-border shadow-lg"
                  >
                    <div className="relative h-[200px] w-full bg-muted">
                      <iframe
                        title={`${location.institution} Location Map`}
                        src={`https://maps.google.com/maps?q=${location.mapsQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="absolute inset-0 grayscale contrast-125 opacity-90 transition-opacity hover:opacity-100 duration-300"
                      />
                    </div>
                    <div className="p-3 bg-card border-t border-border/60 flex items-center justify-between type-meta text-muted-foreground">
                      <span>{location.street}, Toronto</span>
                      <span className="type-meta font-semibold text-primary uppercase">{location.footerMapLabel}</span>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </li>

            {/* Lead */}
            <li className="grid grid-cols-12 items-baseline gap-x-6 gap-y-3 border-b border-border py-7 sm:py-8">
              <div className="col-span-12 sm:col-span-3">
                <h3 className="text-lg font-medium text-foreground">
                  {contact.rows.principalInvestigator.label}
                </h3>
              </div>
              <div className="col-span-12 sm:col-span-9">
                <p className="font-medium text-foreground">{professor.name}</p>
                <p className="mt-1 text-lg leading-relaxed text-muted-foreground">
                  {professor.title}, {professor.department}
                </p>
                {professor.website && (
                  <Link
                    href={professor.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 type-meta uppercase tracking-[0.22em] text-primary underline decoration-primary/40 decoration-1 underline-offset-[5px] transition-colors hover:decoration-primary"
                  >
                    {contact.personalSiteLabel}
                    <ArrowUpRight className="size-3" />
                  </Link>
                )}
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Find us online */}
      <section data-section="contact-online" data-section-label="Online" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-6 pb-4">
            <h2 className="type-subhead text-foreground">
              {contact.sections.findUsOnline}
            </h2>
          </div>

          <ul>
            {socials.xUrl && (
              <li className="flex items-center justify-between gap-4 border-b border-border py-5">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {contact.onlineChannels.twitter}
                </span>
                <Link
                  href={socials.xUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 text-lg text-foreground transition-colors hover:text-primary"
                >
                  <span>{socials.xHandle}</span>
                  <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            )}
            {socials.email && (
              <li className="flex items-center justify-between gap-4 border-b border-border py-5">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {contact.onlineChannels.email}
                </span>
                <Link
                  href={`mailto:${socials.email}`}
                  className="text-lg text-foreground transition-colors hover:text-primary"
                >
                  {socials.email}
                </Link>
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* Working with us — quote treatment */}
      <section data-section="contact-connect" data-section-label="Connect" className="bg-muted/30">
        <div className="mx-auto w-full max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="mb-6 flex items-baseline justify-between gap-6 border-b border-border pb-4">
            <h2 className="type-subhead text-foreground">
              {contact.sections.workingWithUs}
            </h2>
          </div>
          <p className="max-w-3xl border-l border-primary pl-6 text-lg leading-relaxed text-foreground">
            {contact.connectBody}
          </p>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 type-meta uppercase tracking-[0.22em] text-muted-foreground">
            <span>{contact.audienceTags.prospectiveStudents}</span>
            <span aria-hidden className="h-3 w-px bg-border" />
            <span>{contact.audienceTags.visitingResearchers}</span>
            <span aria-hidden className="h-3 w-px bg-border" />
            <span>{contact.audienceTags.communityPartners}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
