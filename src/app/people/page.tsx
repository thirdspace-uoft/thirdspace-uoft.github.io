import { getContent } from "@/lib/content";
import { memberAnchor, sectionSlug } from "@/lib/people";
import { PiCardClickable } from "@/components/team/pi-card-clickable";
import { MemberCardClickable } from "@/components/team/member-card-clickable";
import { AlumniCardClickable, type AlumniData } from "@/components/team/alumni-card-clickable";
import type { MemberPost } from "@/components/team/member-posts";
import { JsonLd } from "@/components/json-ld";
import { peopleLd } from "@/lib/structured-data";
import { formatPostDate, getBlog, getPostsByAuthor } from "@/lib/blog";

const contentData = getContent();
const { team, professor } = contentData;
const blog = getBlog();

/** A person's blog posts for their profile dialog; none while the blog is off. */
function postsBy(name: string): MemberPost[] {
  if (!blog.enabled) return [];
  return getPostsByAuthor(name).map((p) => ({ slug: p.slug, title: p.title, date: formatPostDate(p.publishedAt) }));
}
const postsLabel = blog.navLabel;

export const metadata = {
  title: team.pageTitle,
  description: team.pageBody,
  alternates: { canonical: "/people" },
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
  awards?: string[];
  profileDetailEyebrow?: string;
};

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
  role,
  members,
  copy,
  profileLabels,
  defaultProfileEyebrow,
  sectionId,
  sectionLabel,
}: {
  index: number;
  role: string;
  members: Member[];
  copy: RoleSectionCopy;
  profileLabels: ProfileLabels;
  defaultProfileEyebrow: string;
  sectionId: string;
  sectionLabel: string;
}) {
  return (
    <section
      data-section={sectionId}
      data-section-label={sectionLabel}
      className="border-t border-border"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {role}
            </h2>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {members.length === 0
              ? copy.membersDash
              : `${members.length} ${
                  members.length === 1
                    ? copy.membersCountSingular
                    : copy.membersCountPlural
                }`}
          </span>
        </div>

        {members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {copy.emptyRoleMessage}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {members.map((m, i) => {
              const glance = m.bioGlance ?? m.focus;
              const anchor = memberAnchor(role, m.name);
              return (
                <MemberCardClickable
                  key={`${m.name}-${i}`}
                  member={{
                    name: m.name,
                    title: m.title,
                    role: m.role,
                    focus: m.focus,
                    imagePath: m.imagePath,
                    links: m.links,
                    bioGlance: glance,
                  }}
                  profile={{
                    eyebrow: m.profileDetailEyebrow ?? defaultProfileEyebrow,
                    bio: m.bio,
                    areasOfInterest: m.areasOfInterest,
                    researchInterests: m.researchInterests,
                    website: m.website,
                    awards: m.awards,
                  }}
                  labels={profileLabels}
                  anchor={anchor}
                  posts={postsBy(m.name)}
                  postsLabel={postsLabel}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default function PeoplePage() {
  const sectionId = (role: string) => sectionSlug(role);

  return (
    <main className="bg-background">
      <JsonLd data={peopleLd()} />
      {/* Hero — headline & description */}
      <section
        data-section="team"
        data-section-label="People"
        className="border-b border-border"
      >
        <div className="mx-auto w-full max-w-6xl px-5 pt-12 pb-12 sm:px-8 sm:pt-16 sm:pb-16">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {team.pageHeadline}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {team.pageBody}
            </p>
          </div>
        </div>
      </section>

      {/* Principal Investigator Section */}
      <section
        data-section="team-pi"
        data-section-label="PI"
        className="border-b border-border"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4 border-b border-border pb-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {team.principalInvestigatorRole}
            </h2>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {`1 ${team.membersCountSingular}`}
            </span>
          </div>

          <PiCardClickable
            professor={professor}
            labels={{
              open: team.profileOpenLabel,
              name: team.profileDetailNameLabel,
              bio: team.profileDetailBioLabel,
              areas: team.profileDetailAreasLabel,
              research: team.profileDetailResearchLabel,
              website: team.profileDetailWebsiteLabel,
              close: team.profileCloseLabel,
            }}
            eyebrowBadge={team.principalInvestigatorRole}
            anchor={memberAnchor(team.principalInvestigatorRole, professor.name)}
            posts={postsBy(professor.name)}
            postsLabel={postsLabel}
          />
        </div>
      </section>

      {/* Active Role Sections (Postdocs, PhD Students, MSc, Undergraduates) */}
      {team.sections
        .filter((section) => (section.members ?? []).length > 0)
        .map((section, idx) => (
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
            sectionId={sectionId(section.role)}
            sectionLabel={section.role}
          />
        ))}

      {/* Alumni Section */}
      {(() => {
        const allAlumni = (team.alumni.members ?? []) as AlumniData[];
        const getRoleRank = (m: AlumniData) => {
          const text = `${m.role || ""} ${m.title || ""}`.toLowerCase();
          if (
            text.includes("postdoc") ||
            text.includes("post-doc") ||
            text.includes("postdoctoral")
          ) {
            return 1; // Postdoctorals first
          }
          if (text.includes("former phd") || text.includes("phd student")) {
            return 2; // PhD next
          }
          if (
            text.includes("msc") ||
            text.includes("master") ||
            text.includes("visiting") ||
            text.includes("phd")
          ) {
            return 3; // Masters next
          }
          return 4; // Undergraduates
        };

        const isGraduateOrPostdoc = (m: AlumniData) => getRoleRank(m) < 4;

        const gradPostdocAlumni = allAlumni
          .filter(isGraduateOrPostdoc)
          .sort((a, b) => getRoleRank(a) - getRoleRank(b));
        const undergradAlumni = allAlumni.filter((m) => !isGraduateOrPostdoc(m));

        const renderGrid = (members: AlumniData[]) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
            {members.map((m, i) => (
              <AlumniCardClickable
                key={`${m.name}-${i}`}
                alumni={m}
                labels={{
                  open: team.profileOpenLabel,
                  name: team.profileDetailNameLabel,
                  bio: team.profileDetailBioLabel,
                  areas: team.profileDetailAreasLabel,
                  research: team.profileDetailResearchLabel,
                  website: team.profileDetailWebsiteLabel,
                  close: team.profileCloseLabel,
                }}
                anchor={memberAnchor("alumni", m.name)}
              />
            ))}
          </div>
        );

        return (
          <section
            data-section="team-alumni"
            data-section-label="Alumni"
            className="border-t border-border"
          >
            <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
              {/* Section Header */}
              <div className="mb-8 border-b border-border pb-4">
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {team.alumni.title}
                </h2>
              </div>

              {allAlumni.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    {team.emptyAlumniMessage}
                  </p>
                </div>
              ) : (
                <div className="space-y-12">
                  {/* Postdoctoral, PhD & Master's Alumni */}
                  {gradPostdocAlumni.length > 0 && (
                    <div className="space-y-6">
                      <div className="border-b border-border/60 pb-2.5">
                        <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                          Postdoctoral, PhD &amp; Master&apos;s Alumni
                        </h3>
                      </div>
                      {renderGrid(gradPostdocAlumni)}
                    </div>
                  )}

                  {/* Undergraduate Alumni */}
                  {undergradAlumni.length > 0 && (
                    <div className="space-y-6">
                      <div className="border-b border-border/60 pb-2.5">
                        <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                          Undergraduate Alumni
                        </h3>
                      </div>
                      {renderGrid(undergradAlumni)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        );
      })()}
    </main>
  );
}
