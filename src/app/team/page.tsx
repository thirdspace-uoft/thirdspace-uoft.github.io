import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";

import contentData from "../../../public/config/content.json";
import { getAssetPath } from "@/lib/utils";
import { pad2 } from "@/lib/section-numbering";
import { MemberRowClickable } from "@/components/team/member-row-clickable";

export const metadata: Metadata = {
  title: contentData.team.pageTitle,
  description: contentData.team.pageBody,
};

type Member = {
  name: string;
  title?: string;
  role?: string;
  focus?: string;
  imagePath?: string;
  links?: { label: string; url: string }[];
  bioGlance?: string;
  bio?: string;
  areasOfInterest?: string[];
  researchInterests?: string;
  website?: string;
  profileDetailEyebrow?: string;
};

type AlumniMember = {
  name: string;
  role?: string;
  currentPosition?: string;
  currentAffiliation?: string;
};

/**
 * Editorial member index: portrait + numbered name + role + focus +
 * outbound links. No card chrome — each member is a hairline-divided
 * row inside a role section, reading like a journal masthead.
 */
function MemberRow({ index, member }: { index: number; member: Member }) {
  const homepage = member.links?.find((l) => l.url);
  const otherLinks = member.links?.filter((l) => l.url).slice(1) ?? [];
  const hasImage = !!member.imagePath;

  return (
    <article className="grid grid-cols-12 items-start gap-x-6 gap-y-3 border-t border-border py-7 sm:py-8">
      <span className="col-span-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:col-span-1">
        {pad2(index + 1)}
      </span>

      {hasImage && (
        <div className="col-span-10 sm:col-span-2">
          <div className="relative aspect-square w-20 overflow-hidden bg-muted sm:w-24">
            <Image
              src={getAssetPath(member.imagePath!)}
              alt={member.name}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
        </div>
      )}

      <div
        className={
          "col-span-12 " + (hasImage ? "sm:col-span-6" : "sm:col-span-7")
        }
      >
        {homepage ? (
          <Link
            href={homepage.url}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-baseline gap-1.5 font-heading text-lg font-medium tracking-[-0.02em] text-foreground transition-colors hover:text-primary"
          >
            {member.name}
            <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ) : (
          <p className="font-heading text-lg font-medium tracking-[-0.02em] text-foreground">
            {member.name}
          </p>
        )}
        {(member.title || member.role) && (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {member.title || member.role}
          </p>
        )}
        {member.focus && (
          <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
            {member.focus}
          </p>
        )}
      </div>

      <div
        className={
          "col-span-12 " + (hasImage ? "sm:col-span-3" : "sm:col-span-4")
        }
      >
        {otherLinks.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
            {otherLinks.map((link, idx) => (
              <li key={`${link.label}-${idx}`}>
                <Link
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                  <ArrowUpRight className="size-2.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

type RoleSectionCopy = {
  membersDash: string;
  membersCountSingular: string;
  membersCountPlural: string;
  emptyRoleMessage: string;
};

type ProfileLabels = {
  open: string;
  name: string;
  bio: string;
  areas: string;
  research: string;
  website: string;
  close: string;
};

function RoleSection({
  index,
  role,
  members,
  copy,
  profileLabels,
  defaultProfileEyebrow,
}: {
  index: number;
  role: string;
  members: Member[];
  copy: RoleSectionCopy;
  profileLabels: ProfileLabels;
  defaultProfileEyebrow: string;
}) {
  return (
    <section className="border-t border-border">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="mb-6 flex items-baseline justify-between gap-6 border-b border-border pb-4">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {pad2(index)}
            </span>
            <h2 className="font-heading text-2xl font-medium tracking-[-0.025em] text-foreground sm:text-3xl">
              {role}
            </h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {members.length === 0
              ? copy.membersDash
              : `${members.length} ${members.length === 1 ? copy.membersCountSingular : copy.membersCountPlural}`}
          </span>
        </div>

        {members.length === 0 ? (
          <p className="py-8 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {copy.emptyRoleMessage}
          </p>
        ) : (
          <div>
            {members.map((m, i) => {
              const hasProfile = !!m.bio;
              const glance = m.bioGlance ?? m.focus;
              if (hasProfile) {
                return (
                  <MemberRowClickable
                    key={`${m.name}-${i}`}
                    index={i}
                    member={{
                      name: m.name,
                      title: m.title,
                      imagePath: m.imagePath,
                    }}
                    profile={{
                      eyebrow: m.profileDetailEyebrow ?? defaultProfileEyebrow,
                      bio: m.bio,
                      areasOfInterest: m.areasOfInterest,
                      researchInterests: m.researchInterests,
                      website: m.website,
                    }}
                    labels={profileLabels}
                    bioGlance={glance}
                  />
                );
              }
              return <MemberRow key={`${m.name}-${i}`} index={i} member={m} />;
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default function TeamPage() {
  const { team, professor } = contentData;

  // Lift the PI from the existing professor block into the unified member shape
  const pi: Member = {
    name: professor.name,
    title: professor.title,
    focus: `${professor.department} · ${professor.institution}`,
    imagePath: professor.imagePath,
    links: professor.website
      ? [{ label: team.homepageLinkLabel, url: professor.website }]
      : [],
  };

  const totalMembers = 1 + team.sections.reduce((acc, s) => {
    const list = (s.members ?? []) as Member[];
    return acc + list.length;
  }, 0);

  return (
    <main className="bg-background">
      {/* Hero — meta strip + headline */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 pt-16 pb-16 sm:px-8 sm:pt-24 sm:pb-20">
          <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border pb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {`${team.heroRosterWord} · ${new Date().getFullYear()}`}
            </span>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {`${totalMembers} ${totalMembers === 1 ? team.activeMembersWordSingular : team.activeMembersWordPlural}`}
            </span>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {`${team.sections.length + 1} ${(team.sections.length + 1) === 1 ? team.sectionsCountSingular : team.sectionsCountPlural}`}
            </span>
          </div>

          <div className="grid gap-10 lg:grid-cols-12">
            <h1 className="font-heading text-[clamp(2.25rem,5vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.035em] text-foreground lg:col-span-8">
              {team.pageHeadline}
            </h1>
            <p className="max-w-prose text-pretty text-base leading-7 text-muted-foreground lg:col-span-4 lg:pt-3">
              {team.pageBody}
            </p>
          </div>
        </div>
      </section>

      {/* Principal Investigator — opens detail dialog on click */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-6 flex items-baseline justify-between gap-6 border-b border-border pb-4">
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {pad2(1)}
              </span>
              <h2 className="font-heading text-2xl font-medium tracking-[-0.025em] text-foreground sm:text-3xl">
                {team.principalInvestigatorRole}
              </h2>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {`1 ${team.membersCountSingular}`}
            </span>
          </div>

          <MemberRowClickable
            index={0}
            member={{
              name: pi.name,
              title: pi.title,
              imagePath: pi.imagePath,
            }}
            profile={{
              eyebrow: professor.profileDetailEyebrow,
              bio: professor.bio,
              areasOfInterest: professor.areasOfInterest,
              researchInterests: professor.researchInterests,
              website: professor.website,
            }}
            labels={{
              open: team.profileOpenLabel,
              name: team.profileDetailNameLabel,
              bio: team.profileDetailBioLabel,
              areas: team.profileDetailAreasLabel,
              research: team.profileDetailResearchLabel,
              website: team.profileDetailWebsiteLabel,
              close: team.profileCloseLabel,
            }}
            bioGlance={team.piRowBioGlance}
          />
        </div>
      </section>

      {/* Other role sections */}
      {team.sections.map((section, idx) => (
        <RoleSection
          key={section.role}
          index={idx + 2}
          role={section.role}
          members={(section.members ?? []) as Member[]}
          copy={{
            membersDash: team.membersDash,
            membersCountSingular: team.membersCountSingular,
            membersCountPlural: team.membersCountPlural,
            emptyRoleMessage: team.emptyRoleMessage,
          }}
          profileLabels={{
            open: team.profileOpenLabel,
            name: team.profileDetailNameLabel,
            bio: team.profileDetailBioLabel,
            areas: team.profileDetailAreasLabel,
            research: team.profileDetailResearchLabel,
            website: team.profileDetailWebsiteLabel,
            close: team.profileCloseLabel,
          }}
          defaultProfileEyebrow={professor.profileDetailEyebrow}
        />
      ))}

      {/* Alumni */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-6 flex items-baseline justify-between gap-6 border-b border-border pb-4">
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {pad2(team.sections.length + 2)}
              </span>
              <h2 className="font-heading text-2xl font-medium tracking-[-0.025em] text-foreground sm:text-3xl">
                {team.alumni.title}
              </h2>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {((team.alumni.members ?? []) as AlumniMember[]).length === 0
                ? team.membersDash
                : `${(team.alumni.members ?? []).length} ${(team.alumni.members ?? []).length === 1 ? team.alumniCountSingular : team.alumniCountPlural}`}
            </span>
          </div>

          {((team.alumni.members ?? []) as AlumniMember[]).length === 0 ? (
            <p className="py-8 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {team.emptyAlumniMessage}
            </p>
          ) : (
            <ul className="border-t border-border">
              {((team.alumni.members ?? []) as AlumniMember[]).map((m, i) => (
                <li
                  key={`${m.name}-${i}`}
                  className="grid grid-cols-12 items-baseline gap-x-4 gap-y-1 border-b border-border py-5 sm:py-6"
                >
                  <span className="col-span-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:col-span-1">
                    {pad2(i + 1)}
                  </span>
                  <div className="col-span-10 sm:col-span-5">
                    <p className="font-heading text-base font-medium tracking-[-0.015em] text-foreground">
                      {m.name}
                    </p>
                    {m.role && (
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        {m.role}
                      </p>
                    )}
                  </div>
                  <p className="col-span-12 text-sm leading-6 text-muted-foreground sm:col-span-6">
                    {[m.currentPosition, m.currentAffiliation]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
