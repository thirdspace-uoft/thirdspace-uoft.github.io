"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarCheck, Images, MapPin, X } from "lucide-react";

import { RichText } from "@/components/research/rich-text";
import { ResearchSlider } from "@/components/research/research-media";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  bookingUrl,
  conferenceYear,
  dateBadge,
  formatDateRange,
  guestNames,
  httpUrl,
  resolveAttendees,
  type Conference,
  type FindUsContent,
  type Person,
} from "@/lib/find-us";
import { cn, getImageUrl } from "@/lib/utils";

/** A member's photo as a small circle, falling back to their initials. */
function Avatar({ person, size = 40, className }: { person: Person; size?: number; className?: string }) {
  const initials = person.name
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-card bg-muted text-xs font-semibold text-muted-foreground",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {person.imagePath ? (
        <Image src={getImageUrl(person.imagePath)} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}

function Attendees({ conference, people, label }: { conference: Conference; people: Person[]; label?: string }) {
  const attendees = resolveAttendees(conference, people);
  const guests = guestNames(conference);
  if (attendees.length === 0 && guests.length === 0) return null;
  return (
    <div className="space-y-2">
      {label && <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>}
      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        {attendees.map((person) => (
          <li key={person.key}>
            <Link href={person.href} className="group inline-flex items-center gap-2 text-sm">
              <Avatar person={person} size={32} />
              <span className="font-medium text-foreground transition-colors group-hover:text-primary">{person.name}</span>
            </Link>
          </li>
        ))}
        {guests.map((name) => (
          <li key={name} className="inline-flex items-center text-sm text-muted-foreground">
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function UpcomingCard({ conference, findUs, people }: { conference: Conference; findUs: FindUsContent; people: Person[] }) {
  const labels = findUs.labels ?? {};
  const badge = dateBadge(conference.startDate, conference.endDate);
  const booking = bookingUrl(conference, findUs);
  const site = httpUrl(conference.websiteUrl);
  return (
    <li
      id={conference.slug ? `conference-${conference.slug}` : undefined}
      className="flex flex-col gap-5 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:flex-row sm:p-6"
    >
      {badge && (
        <div className="flex w-full shrink-0 items-baseline gap-2 self-start rounded-xl bg-primary/8 px-4 py-3 text-primary sm:w-28 sm:flex-col sm:items-center sm:gap-0 sm:text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em]">{badge.month}</span>
          <span className="whitespace-nowrap text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">{badge.days}</span>
          <span className="font-mono text-xs text-primary/80">{badge.year}</span>
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-4">
        <div className="space-y-1">
          <h4 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">{conference.name}</h4>
          {conference.fullName && <p className="text-sm text-muted-foreground">{conference.fullName}</p>}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm text-foreground/80">
            <span>{formatDateRange(conference.startDate, conference.endDate)}</span>
            {conference.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 text-primary" aria-hidden="true" />
                {conference.location}
              </span>
            )}
          </p>
          {conference.note && <p className="pt-1 text-sm leading-relaxed text-muted-foreground">{conference.note}</p>}
        </div>
        <Attendees conference={conference} people={people} label={labels.attendees} />
        {(booking || site) && (
          <div className="flex flex-wrap gap-3 pt-1">
            {booking && labels.bookMeeting && (
              <Button asChild size="sm">
                <a href={booking} target="_blank" rel="noopener noreferrer">
                  <CalendarCheck aria-hidden="true" />
                  {labels.bookMeeting}
                </a>
              </Button>
            )}
            {site && labels.conferenceSite && (
              <Button asChild size="sm" variant="outline">
                <a href={site} target="_blank" rel="noopener noreferrer">
                  {labels.conferenceSite}
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function FindUsSection({
  findUs,
  upcoming,
  past,
  people,
}: {
  findUs: FindUsContent;
  upcoming: Conference[];
  past: Conference[];
  people: Person[];
}) {
  const labels = findUs.labels ?? {};
  const years = [...new Set(past.map(conferenceYear).filter((y): y is number => y !== null))];
  const [year, setYear] = React.useState<number | "all">("all");
  const [galleryId, setGalleryId] = React.useState<string | null>(null);
  const shownPast = year === "all" ? past : past.filter((c) => conferenceYear(c) === year);
  const gallery = past.find((c) => (c.id ?? c.slug) === galleryId);
  const labBooking = bookingUrl(undefined, findUs);

  return (
    <section id="find-us" data-section="find-us" data-section-label={findUs.heading} className="border-t border-border">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{findUs.heading}</h2>
            <RichText text={findUs.intro} className="mt-3 text-base leading-relaxed text-muted-foreground" />
          </div>
          {labBooking && labels.bookMeeting && (
            <Button asChild className="shrink-0">
              <a href={labBooking} target="_blank" rel="noopener noreferrer">
                <CalendarCheck aria-hidden="true" />
                {labels.bookMeeting}
              </a>
            </Button>
          )}
        </div>

        {/* Upcoming */}
        <h3 className="mt-10 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">{labels.upcomingHeading}</h3>
        {upcoming.length > 0 ? (
          <ul className="mt-3 grid gap-4 lg:grid-cols-2">
            {upcoming.map((conference) => (
              <UpcomingCard key={conference.id ?? conference.slug} conference={conference} findUs={findUs} people={people} />
            ))}
          </ul>
        ) : (
          labels.emptyUpcoming && (
            <p className="mt-3 rounded-2xl border border-dashed border-border bg-card/40 px-5 py-6 text-sm text-muted-foreground">
              {labels.emptyUpcoming}
            </p>
          )
        )}

        {/* Past, filtered by year */}
        {past.length > 0 && (
          <div className="mt-14">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold tracking-tight text-foreground">{labels.pastHeading}</h3>
              {years.length > 1 && (
                <div role="group" aria-label={labels.pastHeading} className="flex flex-wrap gap-1.5">
                  {(["all", ...years] as const).map((y) => (
                    <button
                      key={y}
                      type="button"
                      aria-pressed={year === y}
                      onClick={() => setYear(y)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                        year === y
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground/70 hover:border-primary/40 hover:text-primary",
                      )}
                    >
                      {y === "all" ? labels.allYears : y}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <ul className="mt-4 grid border-t border-border md:grid-cols-2 md:gap-x-10">
              {shownPast.map((conference) => {
                const photos = (conference.photos ?? []).filter((p) => p.path);
                const attendees = [...resolveAttendees(conference, people).map((p) => p.name), ...guestNames(conference)];
                return (
                  <li
                    key={conference.id ?? conference.slug}
                    id={conference.slug ? `conference-${conference.slug}` : undefined}
                    className="flex flex-col gap-3 border-b border-border py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{conference.name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {formatDateRange(conference.startDate, conference.endDate)}
                        {conference.location && <> · {conference.location}</>}
                        {conference.note && <> · {conference.note}</>}
                      </p>
                      {attendees.length > 0 && (
                        <p className="mt-1 text-[13px] text-foreground/75">
                          {labels.pastAttendees && <span className="text-muted-foreground">{labels.pastAttendees}: </span>}
                          {attendees.join(", ")}
                        </p>
                      )}
                    </div>
                    {photos.length > 0 && (
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="flex -space-x-2" aria-hidden="true">
                          {photos.slice(0, 3).map((photo, i) => (
                            <span key={i} className="relative size-10 overflow-hidden rounded-lg border-2 border-card bg-muted">
                              <Image src={getImageUrl(photo.path!)} alt="" fill sizes="40px" className="object-cover" />
                            </span>
                          ))}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setGalleryId(conference.id ?? conference.slug ?? null)}>
                          <Images aria-hidden="true" />
                          {labels.photos} ({photos.length})
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {past.length === 0 && labels.emptyPast && (
          <p className="mt-10 text-sm text-muted-foreground">{labels.emptyPast}</p>
        )}
      </div>

      <Dialog open={!!gallery} onOpenChange={(open) => !open && setGalleryId(null)}>
        <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-3xl">
          {gallery && (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-bold tracking-tight">{gallery.name}</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {formatDateRange(gallery.startDate, gallery.endDate)}
                    {gallery.location && <> · {gallery.location}</>}
                  </DialogDescription>
                </div>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={labels.close}>
                    <X />
                  </Button>
                </DialogClose>
              </div>
              <div className="relative aspect-[4/3] w-full bg-muted">
                <ResearchSlider
                  media={(gallery.photos ?? []).filter((p) => p.path)}
                  labels={{ previous: labels.previous, next: labels.next, goToSlide: labels.goToSlide }}
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
