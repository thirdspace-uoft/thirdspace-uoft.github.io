/**
 * Builds Find us conferences (Firestore findUs.conferences) from the lab's own
 * publications: every conference where the lab has a paper since `fromYear`,
 * with its paper count and the lab members among the authors as attendees.
 * Dates and places come from scripts/data/conference-venues.json; venues not
 * listed there are reported, never guessed.
 *
 * Attendance is inferred from authorship. Admins can edit or remove anything
 * in /admin → Find Us; the importer only ever adds.
 */

/** Publication kinds that are presented at a conference. */
export const CONFERENCE_KINDS = ["conferenceProceedings", "extendedAbstracts"];

/** "EMNLP 2026 (Findings)" → "EMNLP 2026"; collapses spaces. */
export function venueKey(venue) {
  return String(venue ?? "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Lower-case words without accents, punctuation or titles ("Prof.", "Dr."). */
export function nameTokens(name) {
  return String(name ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((t) => t && !["prof", "dr", "professor"].includes(t));
}

/**
 * Whether an author string names a member: every word of the member's name
 * appears in the author's ("Ishtiaque Ahmed" matches "Syed Ishtiaque Ahmed"),
 * with at least two words so a lone surname never matches.
 */
export function isSamePerson(author, memberName) {
  const member = nameTokens(memberName);
  if (member.length < 2) return false;
  const words = new Set(nameTokens(author));
  return member.every((t) => words.has(t));
}

/** "CHI 2026" → "chi-2026". */
export function slugify(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const splitAuthors = (authors) =>
  String(authors ?? "")
    .split(/,|\band\b|&/)
    .map((a) => a.trim())
    .filter(Boolean);

/**
 * @param {{ years: Record<string, Record<string, {authors?: string, venue?: string}[]>>, people: {key: string, name: string}[], venues: Record<string, object>, fromYear: number }} input
 * @returns {{ conferences: object[], unknownVenues: string[] }}
 */
export function deriveConferences({ years, people, venues, fromYear }) {
  const groups = new Map();
  for (const [year, sections] of Object.entries(years ?? {})) {
    if (Number(year) < fromYear) continue;
    for (const kind of CONFERENCE_KINDS) {
      for (const paper of sections?.[kind] ?? []) {
        const key = venueKey(paper.venue);
        if (!key) continue;
        const group = groups.get(key) ?? { key, papers: 0, members: new Set() };
        group.papers += 1;
        for (const author of splitAuthors(paper.authors)) {
          for (const person of people) if (isSamePerson(author, person.name)) group.members.add(person.key);
        }
        groups.set(key, group);
      }
    }
  }

  const conferences = [];
  const unknownVenues = [];
  for (const group of groups.values()) {
    const facts = venues[group.key];
    if (!facts) {
      unknownVenues.push(group.key);
      continue;
    }
    // People order: the PI first, then as listed on /people.
    const attendees = people.map((p) => p.key).filter((k) => group.members.has(k));
    const papers = `${group.papers} ${group.papers === 1 ? "paper" : "papers"} from the lab`;
    conferences.push({
      id: `pub-${slugify(group.key)}`,
      slug: slugify(group.key),
      name: group.key,
      fullName: facts.fullName ?? "",
      startDate: facts.startDate ?? "",
      endDate: facts.endDate ?? "",
      location: facts.location ?? "",
      websiteUrl: facts.websiteUrl ?? "",
      calendlyUrl: "",
      note: [papers, facts.note].filter(Boolean).join(" · "),
      attendees,
      guests: "",
      photos: [],
    });
  }
  conferences.sort((a, b) => (b.startDate || "9999").localeCompare(a.startDate || "9999"));
  return { conferences, unknownVenues: unknownVenues.sort() };
}
