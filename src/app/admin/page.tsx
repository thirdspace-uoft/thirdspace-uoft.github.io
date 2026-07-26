"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Layout,
  Layers,
  MapPin,
  Compass,
  FileCode,
  LogOut,
  Download,
  UploadCloud,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Menu,
  Settings,
  Database,
  Users,
  BookOpenCheck,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_SESSION_TTL_HOURS,
} from "@/lib/admin-credentials";
import {
  clearSession,
  readStoredSession,
  signSession,
  storeSession,
  verifySession,
  type AdminSession,
} from "@/lib/admin-session";

export default function AdminPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const expiryTimer = useRef<number | null>(null);

  function clearExpiryTimer() {
    if (expiryTimer.current !== null) {
      window.clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
  }

  function scheduleExpiry(expMs: number) {
    clearExpiryTimer();
    const delay = Math.max(0, expMs - Date.now());
    expiryTimer.current = window.setTimeout(() => {
      signOut("Session expired");
    }, delay);
  }

  async function adopt(token: string): Promise<AdminSession | null> {
    const verified = await verifySession(token);
    if (!verified) {
      clearSession();
      setSession(null);
      return null;
    }
    setSession(verified);
    scheduleExpiry(verified.exp * 1000);
    return verified;
  }

  function signOut(message?: string) {
    clearSession();
    clearExpiryTimer();
    setSession(null);
    if (message) setError(message);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = readStoredSession();
      if (token) await adopt(token);
      if (!cancelled) setChecked(true);
    })();

    function onStorage(e: StorageEvent) {
      if (e.key !== "thirdspace_admin_session") return;
      if (e.newValue === null) {
        clearExpiryTimer();
        setSession(null);
        return;
      }
      if (e.newValue) {
        void adopt(e.newValue);
      }
    }

    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
      clearExpiryTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const form = new FormData(e.currentTarget);
      const email = String(form.get("email") ?? "").trim();
      const password = String(form.get("password") ?? "");

      if (
        email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() ||
        password !== ADMIN_PASSWORD
      ) {
        setError("Invalid credentials");
        return;
      }

      const token = await signSession(email);
      storeSession(token);
      const verified = await verifySession(token);
      if (!verified) {
        setError("Failed to establish session");
        return;
      }
      setSession(verified);
      scheduleExpiry(verified.exp * 1000);
    } finally {
      setPending(false);
    }
  }

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
        {/* Technical drafting grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Verifying Authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative antialiased selection:bg-accent/35">
      {session ? (
        <SignedInView
          email={session.email}
          onSignOut={() => signOut()}
        />
      ) : (
        <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-12 relative">
          {/* Drafting grid backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Left Brand Panel */}
          <aside className="relative lg:col-span-5 hidden flex-col justify-between overflow-hidden border-r border-border bg-card p-12 lg:flex z-10">
            {/* Structural top border mark */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
            
            <div className="relative flex items-center gap-2 text-foreground">
              <div className="flex h-9 w-9 items-center justify-center rounded border-2 border-primary bg-background font-mono text-sm font-bold shadow-sm">
                TS
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Studio Workspace
              </span>
            </div>

            <div className="relative flex flex-col gap-6 max-w-sm">
              <div className="w-fit flex items-center gap-1.5 rounded border border-border bg-background px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                DRAFT.ENV
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif leading-tight">
                Architectural CMS for Thirdspace.
              </h1>
              <p className="text-xs leading-relaxed text-muted-foreground">
                This environment manages content layouts, coordinates, and team modules across UofT campus networks. Commits are pushed directly to main production trees via securely signed local keys.
              </p>
            </div>

            <div className="relative space-y-1">
              <p className="text-[10px] font-mono text-muted-foreground">
                REF: {new Date().getFullYear()}-TS-UofT
              </p>
              <p className="text-[10px] font-mono text-muted-foreground">
                SYSTEM PORT: SECURE_INLINE_RESTRICTED
              </p>
            </div>
          </aside>

          {/* Right Form Panel */}
          <main className="col-span-1 lg:col-span-7 flex items-center justify-center p-4 sm:p-6 md:p-12 z-10">
            <SignInView
              error={error}
              pending={pending}
              onSubmit={onSubmit}
            />
          </main>
        </div>
      )}
    </div>
  );
}

function SignInView({
  error,
  pending,
  onSubmit,
}: {
  error: string | null;
  pending: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-md relative overflow-hidden">
      {/* Decorative Corner Marks */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-border" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-border" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-border" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-border" />

      <div className="mb-8 flex flex-col gap-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground uppercase font-mono">
          System Access
        </h2>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Provide authorized credentials
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-xs font-mono uppercase text-muted-foreground">
            Authorized Email
          </Label>
          <div className="flex items-center gap-2 rounded border border-input bg-background px-3 transition-colors focus-within:border-ring">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@utoronto.ca"
              className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0 text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-xs font-mono uppercase text-muted-foreground">
            Security Passkey
          </Label>
          <div className="flex items-center gap-2 rounded border border-input bg-background px-3 transition-colors focus-within:border-ring">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0 text-xs font-mono"
            />
          </div>
        </div>

        {error ? (
          <div role="alert" className="rounded border border-destructive/20 bg-destructive/10 p-3 text-xs font-mono text-destructive">
            [SYS_ERR] {error}
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={pending}
          variant="default"
          size="lg"
          className="w-full text-xs font-mono uppercase tracking-widest transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          {pending ? "Authenticating Session..." : "Initialize Session"}
        </Button>
      </form>
    </div>
  );
}

function SignedInView({
  email,
  onSignOut,
}: {
  email: string;
  onSignOut: () => void;
}) {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // GitHub integration settings stored locally
  const [pat, setPat] = useState("");
  const [repoOwner, setRepoOwner] = useState("critical-nlp");
  const [repoName, setRepoName] = useState("thirdspace.toronto.edu");
  const [branch, setBranch] = useState("main");
  const [showConfig, setShowConfig] = useState(false);

  // Form tab selection
  const [activeTab, setActiveTab] = useState<"layout" | "hero" | "home" | "pillars" | "homePillars" | "navbar" | "footerLabs" | "location" | "marquee" | "groupOverview" | "professor" | "researchDomains" | "about" | "team" | "publications" | "aboutPage" | "contact">("layout");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Load config from localStorage if available
    setPat(localStorage.getItem("ts_gh_pat") ?? "");
    setRepoOwner(localStorage.getItem("ts_gh_owner") ?? "critical-nlp");
    setRepoName(localStorage.getItem("ts_gh_name") ?? "thirdspace.toronto.edu");
    setBranch(localStorage.getItem("ts_gh_branch") ?? "main");

    // Fetch initial JSON from public asset folder
    fetch("config/content.json")
      .then((res) => res.json())
      .then((data) => {
        setContent(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load local config", err);
        setLoading(false);
      });
  }, []);

  const saveGithubConfig = () => {
    localStorage.setItem("ts_gh_pat", pat);
    localStorage.setItem("ts_gh_owner", repoOwner);
    localStorage.setItem("ts_gh_name", repoName);
    localStorage.setItem("ts_gh_branch", branch);
    setMessage({ type: "success", text: "GitHub Settings updated locally!" });
    setShowConfig(false);
  };

  const handleFieldChange = (section: string, field: string, value: string) => {
    setContent((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handlePillarChange = (index: number, field: string, value: string) => {
    setContent((prev: any) => {
      const pillars = [...prev.pillars];
      pillars[index] = { ...pillars[index], [field]: value };
      return { ...prev, pillars };
    });
  };

  const handleListItemChange = (section: string, index: number, field: string, value: string | boolean) => {
    setContent((prev: any) => {
      const targetSection = prev[section];
      const items = [...targetSection.items];
      items[index] = { ...items[index], [field]: value };
      return {
        ...prev,
        [section]: {
          ...targetSection,
          items,
        },
      };
    });
  };

  const handleNavbarLinkChange = (index: number, field: string, value: string) => {
    setContent((prev: any) => {
      const links = [...prev.navbar.links];
      links[index] = { ...links[index], [field]: value };
      return {
        ...prev,
        navbar: {
          ...prev.navbar,
          links,
        },
      };
    });
  };

  const handleTeamMemberChange = (sectionIndex: number, memberIndex: number, field: string, value: string) => {
    setContent((prev: any) => {
      const sections = [...prev.team.sections];
      const members = [...(sections[sectionIndex].members ?? [])];
      members[memberIndex] = { ...members[memberIndex], [field]: value };
      sections[sectionIndex] = { ...sections[sectionIndex], members };
      return { ...prev, team: { ...prev.team, sections } };
    });
  };

  const handleTeamMemberLinkChange = (sectionIndex: number, memberIndex: number, linkIndex: number, field: "label" | "url", value: string) => {
    setContent((prev: any) => {
      const sections = [...prev.team.sections];
      const members = [...(sections[sectionIndex].members ?? [])];
      const links = [...(members[memberIndex].links ?? [])];
      links[linkIndex] = { ...links[linkIndex], [field]: value };
      members[memberIndex] = { ...members[memberIndex], links };
      sections[sectionIndex] = { ...sections[sectionIndex], members };
      return { ...prev, team: { ...prev.team, sections } };
    });
  };

  const handleTeamMemberLinkAdd = (sectionIndex: number, memberIndex: number) => {
    setContent((prev: any) => {
      const sections = [...prev.team.sections];
      const members = [...(sections[sectionIndex].members ?? [])];
      const links = [...(members[memberIndex].links ?? []), { label: "", url: "" }];
      members[memberIndex] = { ...members[memberIndex], links };
      sections[sectionIndex] = { ...sections[sectionIndex], members };
      return { ...prev, team: { ...prev.team, sections } };
    });
  };

  const handleTeamMemberAdd = (sectionIndex: number) => {
    setContent((prev: any) => {
      const sections = [...prev.team.sections];
      const members = [...(sections[sectionIndex].members ?? []), { name: "", title: "", focus: "", imagePath: "", links: [] }];
      sections[sectionIndex] = { ...sections[sectionIndex], members };
      return { ...prev, team: { ...prev.team, sections } };
    });
  };

  const handleTeamMemberRemove = (sectionIndex: number, memberIndex: number) => {
    setContent((prev: any) => {
      const sections = [...prev.team.sections];
      const members = [...(sections[sectionIndex].members ?? [])];
      members.splice(memberIndex, 1);
      sections[sectionIndex] = { ...sections[sectionIndex], members };
      return { ...prev, team: { ...prev.team, sections } };
    });
  };

  const handleAlumniChange = (index: number, field: string, value: string) => {
    setContent((prev: any) => {
      const members = [...(prev.team.alumni.members ?? [])];
      members[index] = { ...members[index], [field]: value };
      return { ...prev, team: { ...prev.team, alumni: { ...prev.team.alumni, members } } };
    });
  };

  const handleAlumniAdd = () => {
    setContent((prev: any) => {
      const members = [...(prev.team.alumni.members ?? []), { name: "", role: "", currentPosition: "", currentAffiliation: "" }];
      return { ...prev, team: { ...prev.team, alumni: { ...prev.team.alumni, members } } };
    });
  };

  const handleAlumniRemove = (index: number) => {
    setContent((prev: any) => {
      const members = [...(prev.team.alumni.members ?? [])];
      members.splice(index, 1);
      return { ...prev, team: { ...prev.team, alumni: { ...prev.team.alumni, members } } };
    });
  };

  const handleBookChange = (index: number, field: string, value: string) => {
    setContent((prev: any) => {
      const books = [...(prev.publications.books ?? [])];
      books[index] = { ...books[index], [field]: value };
      return { ...prev, publications: { ...prev.publications, books } };
    });
  };

  const handleBookAdd = () => {
    setContent((prev: any) => {
      const books = [...(prev.publications.books ?? []), { title: "", authors: "", year: "", url: "", description: "", coverImagePath: "" }];
      return { ...prev, publications: { ...prev.publications, books } };
    });
  };

  const handleBookRemove = (index: number) => {
    setContent((prev: any) => {
      const books = [...(prev.publications.books ?? [])];
      books.splice(index, 1);
      return { ...prev, publications: { ...prev.publications, books } };
    });
  };

  const handlePubChange = (year: string, kind: string, index: number, field: string, value: string) => {
    setContent((prev: any) => {
      const years = { ...prev.publications.years };
      const bucket = { ...(years[year] ?? {}) };
      const entries = [...(bucket[kind] ?? [])];
      entries[index] = { ...entries[index], [field]: value };
      bucket[kind] = entries;
      years[year] = bucket;
      return { ...prev, publications: { ...prev.publications, years } };
    });
  };

  const handlePubAdd = (year: string, kind: string) => {
    setContent((prev: any) => {
      const years = { ...prev.publications.years };
      const bucket = { ...(years[year] ?? {}) };
      const entries = [...(bucket[kind] ?? []), { authors: "", title: "", venue: "", url: "", doi: "", pages: "", articleNumber: "" }];
      bucket[kind] = entries;
      years[year] = bucket;
      return { ...prev, publications: { ...prev.publications, years } };
    });
  };

  const handlePubRemove = (year: string, kind: string, index: number) => {
    setContent((prev: any) => {
      const years = { ...prev.publications.years };
      const bucket = { ...(years[year] ?? {}) };
      const entries = [...(bucket[kind] ?? [])];
      entries.splice(index, 1);
      bucket[kind] = entries;
      years[year] = bucket;
      return { ...prev, publications: { ...prev.publications, years } };
    });
  };

  const handleYearAdd = () => {
    setContent((prev: any) => {
      const years = { ...prev.publications.years };
      const currentYear = new Date().getFullYear().toString();
      let key = currentYear;
      while (years[key]) {
        key = String(Number(key) - 1);
      }
      years[key] = { label: key, journalArticles: [], conferenceProceedings: [], extendedAbstracts: [], researchArtifacts: [] };
      return { ...prev, publications: { ...prev.publications, years } };
    });
  };

  const handleYearRemove = (year: string) => {
    setContent((prev: any) => {
      const years = { ...prev.publications.years };
      delete years[year];
      return { ...prev, publications: { ...prev.publications, years } };
    });
  };

  const handleApproachItemChange = (index: number, field: string, value: string) => {
    setContent((prev: any) => {
      const items = [...(prev.aboutPage.approachItems ?? [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, aboutPage: { ...prev.aboutPage, approachItems: items } };
    });
  };

  const handleHomePillarsFieldChange = (field: string, value: string) => {
    setContent((prev: any) => ({
      ...prev,
      homePillars: { ...prev.homePillars, [field]: value },
    }));
  };

  const handleResearchDomainColSpanChange = (index: number, value: string) => {
    setContent((prev: any) => {
      const items = [...prev.researchDomains.items];
      items[index] = { ...items[index], colSpan: value };
      return { ...prev, researchDomains: { ...prev.researchDomains, items } };
    });
  };

  const handleResearchDomainAccentChange = (index: number, value: string) => {
    setContent((prev: any) => {
      const items = [...prev.researchDomains.items];
      items[index] = { ...items[index], accent: value };
      return { ...prev, researchDomains: { ...prev.researchDomains, items } };
    });
  };

  const handlePillarIconChange = (index: number, value: string) => {
    setContent((prev: any) => {
      const pillars = [...prev.pillars];
      pillars[index] = { ...pillars[index], icon: value };
      return { ...prev, pillars };
    });
  };

  const handleAreasOfInterestChange = (value: string) => {
    setContent((prev: any) => ({
      ...prev,
      professor: {
        ...prev.professor,
        areasOfInterest: value.split("\n").map((v: string) => v.trim()).filter(Boolean),
      },
    }));
  };

  const handleTeamProfileFieldChange = (sectionIndex: number, memberIndex: number, field: string, value: string) => {
    setContent((prev: any) => {
      const sections = [...prev.team.sections];
      const members = [...(sections[sectionIndex].members ?? [])];
      const current = members[memberIndex] ?? {};
      const newVal = field === "areasOfInterest"
        ? value.split("\n").map((v: string) => v.trim()).filter(Boolean)
        : value;
      members[memberIndex] = { ...current, [field]: newVal };
      sections[sectionIndex] = { ...sections[sectionIndex], members };
      return { ...prev, team: { ...prev.team, sections } };
    });
  };

  const handlePubAwardChange = (year: string, kind: string, index: number, value: string) => {
    setContent((prev: any) => {
      const years = { ...prev.publications.years };
      const bucket = { ...(years[year] ?? {}) };
      const entries = [...(bucket[kind] ?? [])];
      if (value) {
        entries[index] = { ...entries[index], award: value };
      } else {
        const { award, ...rest } = entries[index] ?? {};
        entries[index] = rest;
      }
      bucket[kind] = entries;
      years[year] = bucket;
      return { ...prev, publications: { ...prev.publications, years } };
    });
  };

  const handleContactSectionChange = (section: string, value: string) => {
    setContent((prev: any) => ({
      ...prev,
      contact: {
        ...prev.contact,
        sections: { ...prev.contact.sections, [section]: value },
      },
    }));
  };

  const handleContactRowChange = (row: string, field: "icon" | "label", value: string) => {
    setContent((prev: any) => ({
      ...prev,
      contact: {
        ...prev.contact,
        rows: { ...prev.contact.rows, [row]: { ...prev.contact.rows[row], [field]: value } },
      },
    }));
  };

  const handleContactOnlineChange = (key: string, value: string) => {
    setContent((prev: any) => ({
      ...prev,
      contact: { ...prev.contact, onlineChannels: { ...prev.contact.onlineChannels, [key]: value } },
    }));
  };

  const handleContactAudienceChange = (key: string, value: string) => {
    setContent((prev: any) => ({
      ...prev,
      contact: { ...prev.contact, audienceTags: { ...prev.contact.audienceTags, [key]: value } },
    }));
  };

  const handlePublicationFieldChange = (field: string, value: string) => {
    setContent((prev: any) => ({
      ...prev,
      publications: {
        ...prev.publications,
        [field]: value,
      },
    }));
  };

  const handlePublicationSubsectionChange = (key: string, value: string) => {
    setContent((prev: any) => ({
      ...prev,
      publications: {
        ...prev.publications,
        subsectionTitles: { ...prev.publications.subsectionTitles, [key]: value },
      },
    }));
  };

  const handleFieldChangeNested = (section: string, value: string) => {
    setContent((prev: any) => ({
      ...prev,
      [section]: value,
    }));
  };

  const handleApproachItemAdd = () => {
    setContent((prev: any) => {
      const items = [...(prev.aboutPage.approachItems ?? []), { title: "", body: "" }];
      return { ...prev, aboutPage: { ...prev.aboutPage, approachItems: items } };
    });
  };

  const handleApproachItemRemove = (index: number) => {
    setContent((prev: any) => {
      const items = [...(prev.aboutPage.approachItems ?? [])];
      items.splice(index, 1);
      return { ...prev, aboutPage: { ...prev.aboutPage, approachItems: items } };
    });
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(content, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "content.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePublish = async () => {
    if (!pat) {
      setMessage({ type: "error", text: "GitHub Personal Access Token (PAT) required to push changes." });
      setShowConfig(true);
      return;
    }

    setSaving(true);
    setMessage(null);

    const filePath = "public/config/content.json";
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`;

    try {
      let sha = "";
      const getRes = await fetch(url, {
        headers: {
          Authorization: `token ${pat}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (getRes.status === 200) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      } else if (getRes.status !== 404) {
        throw new Error(`Connection verification failed. Status: ${getRes.status}`);
      }

      const updatedContent = JSON.stringify(content, null, 2);
      const base64Content = btoa(unescape(encodeURIComponent(updatedContent)));

      const commitRes = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `token ${pat}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "CMS Update: public/config/content.json",
          content: base64Content,
          sha: sha || undefined,
          branch,
        }),
      });

      if (commitRes.ok) {
        setMessage({
          type: "success",
          text: "Changes published to repository branch! Cloud compilation initiated.",
        });
      } else {
        const errorData = await commitRes.json();
        throw new Error(errorData.message || "Branch commit rejected.");
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: `Publish rejected: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const tabsList = [
    { id: "layout" as const, label: "01. Page Layout", icon: FileCode },
    { id: "hero" as const, label: "02. Hero Banner", icon: Layout },
    { id: "home" as const, label: "03. Home Meta", icon: Sparkles },
    { id: "groupOverview" as const, label: "04. Group Overview", icon: Layout },
    { id: "homePillars" as const, label: "05. Home Pillars", icon: Layers },
    { id: "pillars" as const, label: "06. Core Pillars", icon: Layers },
    { id: "professor" as const, label: "07. Professor", icon: ShieldCheck },
    { id: "researchDomains" as const, label: "08. Research Domains", icon: Database },
    { id: "marquee" as const, label: "09. Marquee Band", icon: Sparkles },
    { id: "about" as const, label: "10. About Section", icon: FileCode },
    { id: "team" as const, label: "11. Team", icon: Users },
    { id: "publications" as const, label: "12. Publications", icon: BookOpenCheck },
    { id: "aboutPage" as const, label: "13. About Page", icon: FileCode },
    { id: "contact" as const, label: "14. Contact", icon: Mail },
    { id: "navbar" as const, label: "15. Nav Settings", icon: Compass },
    { id: "footerLabs" as const, label: "16. Lab & Campuses", icon: Database },
    { id: "location" as const, label: "17. Campus Location", icon: MapPin },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background relative">
        <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Loading CMS Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background relative">
      {/* Grid lines globally on the background canvas */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px] opacity-75 pointer-events-none z-0" />

      {/* TECHNICAL LAYOUT: LEFT SIDEBAR (Structural Outline) */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 md:relative flex h-full flex-col border-r border-border bg-card transition-all duration-300 ${
          sidebarOpen ? "w-64 translate-x-0" : "w-16 -translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar top corner line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary" />

        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border-2 border-primary bg-background text-[10px] font-bold font-mono">
              TS
            </div>
            {sidebarOpen && (
              <span className="text-xs font-bold font-mono uppercase tracking-widest text-foreground">
                Thirdspace.CMS
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex h-7 w-7 hover:bg-muted"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </Button>
        </div>

        {/* Index Navigation list */}
        <div className="p-3">
          <span className={`text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-3 block mb-2 ${sidebarOpen ? "" : "sr-only"}`}>
            Draft Sections
          </span>
          <nav className="space-y-1">
            {tabsList.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded px-3 py-2 text-xs font-mono transition-colors text-left ${
                    isActive
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {sidebarOpen && <span>{tab.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile / session state in footer */}
        <div className="mt-auto border-t border-border p-3 bg-muted/40">
          <div className={`flex items-center gap-3 ${sidebarOpen ? "justify-between" : "justify-center"}`}>
            {sidebarOpen ? (
              <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] font-mono text-foreground truncate">{email}</span>
                <span className="text-[9px] font-mono text-muted-foreground uppercase">SYS_KEYS_LOADED</span>
              </div>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              onClick={onSignOut}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Terminate Session"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* WORKSPACE AREA */}
      <div className={`flex flex-1 flex-col overflow-hidden z-10 relative transition-all duration-300 ${
        sidebarOpen ? "ml-64 md:ml-0" : "ml-0"
      }`}>
        {/* Workspace Top Header Bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8 text-muted-foreground"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex flex-col">
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Current Scope</span>
              <h1 className="text-sm font-bold tracking-tight text-foreground uppercase font-mono flex items-center gap-2">
                <FileCode className="h-4 w-4 text-primary" />
                {activeTab === "footerLabs" ? "Labs & Campuses" : activeTab}
              </h1>
            </div>
          </div>

          {/* Action Blocks */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
              className="text-xs font-mono h-8 rounded"
            >
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="text-xs font-mono h-8 rounded"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline">Backup</span>
            </Button>
            <Button
              disabled={saving}
              onClick={handlePublish}
              variant="default"
              size="sm"
              className="text-xs font-mono h-8 rounded transition-all active:scale-[0.98]"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
              )}
              <span>Commit Draft</span>
            </Button>
          </div>
        </header>

        {/* Main interactive scrollable container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-3xl space-y-6">
            {message && (
              <div
                className={`rounded border p-4 text-xs font-mono flex items-center justify-between gap-3 ${
                  message.type === "success"
                    ? "bg-primary text-primary-foreground border-border"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
                  <span>{message.text}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs font-mono text-inherit hover:bg-white/10"
                  onClick={() => setMessage(null)}
                >
                  [Dismiss]
                </Button>
              </div>
            )}

            {/* GitHub integration overlay config */}
            {showConfig && (
              <Card className="rounded-lg border-2 border-dashed border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-mono uppercase tracking-wider text-foreground flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    GitHub Sync Protocol
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Specify the secure repository endpoint keys. Local values persist inside secure cache.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="pat" className="text-[10px] font-mono uppercase text-muted-foreground">Security PAT Key</Label>
                      <Input
                        id="pat"
                        type="password"
                        placeholder="ghp_..."
                        value={pat}
                        onChange={(e) => setPat(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="owner" className="text-[10px] font-mono uppercase text-muted-foreground">Repo Owner</Label>
                      <Input
                        id="owner"
                        type="text"
                        placeholder="critical-nlp"
                        value={repoOwner}
                        onChange={(e) => setRepoOwner(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-[10px] font-mono uppercase text-muted-foreground">Repo Directory</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="thirdspace.toronto.edu"
                        value={repoName}
                        onChange={(e) => setRepoName(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="branch" className="text-[10px] font-mono uppercase text-muted-foreground">Target Branch</Label>
                      <Input
                        id="branch"
                        type="text"
                        placeholder="main"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t border-border pt-3">
                  <Button size="sm" variant="ghost" className="text-xs font-mono" onClick={() => setShowConfig(false)}>
                    [Cancel]
                  </Button>
                  <Button size="sm" variant="default" className="text-xs font-mono rounded" onClick={saveGithubConfig}>
                    [Apply Changes]
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Dynamic settings draft sheets based on active index */}
            <div className="space-y-6">
              {activeTab === "layout" && content?.layout && (
                <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                  <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">L00</div>
                  <div className="mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Draft Sheet</span>
                    <h3 className="text-base font-bold text-foreground font-serif">Global Page Layout</h3>
                    <p className="text-[11px] text-muted-foreground">Top-level metadata for site title, description, and home aria suffix.</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Page Title</Label>
                    <Input value={content.layout.pageTitle} onChange={(e) => handleFieldChange("layout", "pageTitle", e.target.value)} className="font-mono text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Page Description</Label>
                    <textarea
                      rows={3}
                      value={content.layout.pageDescription}
                      onChange={(e) => handleFieldChange("layout", "pageDescription", e.target.value)}
                      className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Home Aria Label Suffix</Label>
                    <Input value={content.layout.homeAriaLabelSuffix} onChange={(e) => handleFieldChange("layout", "homeAriaLabelSuffix", e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
              )}

              {activeTab === "hero" && content?.hero && (
                <div className="relative bg-card border border-border rounded p-6 shadow-sm">
                  {/* Design Accent corner marks */}
                  <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">
                    S01
                  </div>

                  <div className="mb-6">
                    <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Draft Sheet</h2>
                    <h3 className="text-base font-bold text-foreground font-serif">Hero Section Properties</h3>
                    <p className="text-[11px] text-muted-foreground mt-1">Configures index page greeting wordmarks and action CTAs.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="hero-badge" className="text-[10px] font-mono uppercase text-muted-foreground">Eyebrow Banner</Label>
                        <Input
                          id="hero-badge"
                          value={content.hero.badge}
                          onChange={(e) => handleFieldChange("hero", "badge", e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="hero-location" className="text-[10px] font-mono uppercase text-muted-foreground">Location Chip</Label>
                        <Input
                          id="hero-location"
                          value={content.hero.locationChip ?? ""}
                          onChange={(e) => handleFieldChange("hero", "locationChip", e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Headline Line 1</Label>
                      <Input value={content.hero.headlineLine1 ?? ""} onChange={(e) => handleFieldChange("hero", "headlineLine1", e.target.value)} className="font-serif font-bold" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Headline Line 2</Label>
                      <Input value={content.hero.headlineLine2 ?? ""} onChange={(e) => handleFieldChange("hero", "headlineLine2", e.target.value)} className="font-serif" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Headline Line 3 (accent)</Label>
                      <Input value={content.hero.headlineLine3 ?? ""} onChange={(e) => handleFieldChange("hero", "headlineLine3", e.target.value)} className="font-serif" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="hero-sub" className="text-[10px] font-mono uppercase text-muted-foreground">Sub Paragraph</Label>
                      <textarea
                        id="hero-sub"
                        rows={3}
                        value={content.hero.subParagraph ?? ""}
                        onChange={(e) => handleFieldChange("hero", "subParagraph", e.target.value)}
                        className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="hero-p-action" className="text-[10px] font-mono uppercase text-muted-foreground">Primary CTA Label</Label>
                        <Input
                          id="hero-p-action"
                          value={content.hero.primaryActionText}
                          onChange={(e) => handleFieldChange("hero", "primaryActionText", e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="hero-s-action" className="text-[10px] font-mono uppercase text-muted-foreground">Secondary CTA Label</Label>
                        <Input
                          id="hero-s-action"
                          value={content.hero.secondaryActionText}
                          onChange={(e) => handleFieldChange("hero", "secondaryActionText", e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Research Posture Label</Label>
                      <Input value={content.hero.researchPostureLabel ?? ""} onChange={(e) => handleFieldChange("hero", "researchPostureLabel", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Research Posture Body</Label>
                      <textarea
                        rows={2}
                        value={content.hero.researchPostureBody ?? ""}
                        onChange={(e) => handleFieldChange("hero", "researchPostureBody", e.target.value)}
                        className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Methods Label</Label>
                        <Input value={content.hero.methodsLabel ?? ""} onChange={(e) => handleFieldChange("hero", "methodsLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Methods Value</Label>
                        <Input value={content.hero.methodsValue ?? ""} onChange={(e) => handleFieldChange("hero", "methodsValue", e.target.value)} className="text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Focus Label</Label>
                        <Input value={content.hero.focusLabel ?? ""} onChange={(e) => handleFieldChange("hero", "focusLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Focus Value</Label>
                        <Input value={content.hero.focusValue ?? ""} onChange={(e) => handleFieldChange("hero", "focusValue", e.target.value)} className="text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Group Photo Path (from /public/group-photos)</Label>
                        <Input value={content.hero.groupPhotoPath ?? ""} onChange={(e) => handleFieldChange("hero", "groupPhotoPath", e.target.value)} placeholder="/group-photos/group_photo_crp.PNG" className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Group Photo Alt Text</Label>
                        <Input value={content.hero.groupPhotoAlt ?? ""} onChange={(e) => handleFieldChange("hero", "groupPhotoAlt", e.target.value)} className="text-xs" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">SEO Title</Label>
                      <Input value={content.hero.title ?? ""} onChange={(e) => handleFieldChange("hero", "title", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">SEO Description</Label>
                      <textarea
                        rows={3}
                        value={content.hero.description ?? ""}
                        onChange={(e) => handleFieldChange("hero", "description", e.target.value)}
                        className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Fig. Prefix</Label>
                        <Input value={content.hero.figPrefix ?? ""} onChange={(e) => handleFieldChange("hero", "figPrefix", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Fig. Group Alt</Label>
                        <Input value={content.hero.figGroupAlt ?? ""} onChange={(e) => handleFieldChange("hero", "figGroupAlt", e.target.value)} className="font-mono text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "home" && content?.home && (
                <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                  <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">H01</div>
                  <div className="mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Draft Sheet</span>
                    <h3 className="text-base font-bold text-foreground font-serif">Home Page Meta</h3>
                    <p className="text-[11px] text-muted-foreground">Volume markers, figure labels, and PI labelling for the home index.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Vol. Prefix</Label>
                      <Input value={content.home.metaVolPrefix ?? ""} onChange={(e) => handleFieldChange("home", "metaVolPrefix", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Vol. Number</Label>
                      <Input value={content.home.metaVolNumber ?? ""} onChange={(e) => handleFieldChange("home", "metaVolNumber", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Vol. Year</Label>
                      <Input value={content.home.metaVolYear ?? ""} onChange={(e) => handleFieldChange("home", "metaVolYear", e.target.value)} className="font-mono text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Fig. Group Prefix</Label>
                      <Input value={content.home.figGroupPrefix ?? ""} onChange={(e) => handleFieldChange("home", "figGroupPrefix", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">PI Fig. Label</Label>
                      <Input value={content.home.groupOverviewFigLabel ?? ""} onChange={(e) => handleFieldChange("home", "groupOverviewFigLabel", e.target.value)} className="font-mono text-xs" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "homePillars" && content?.homePillars && (
                <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                  <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">HP1</div>
                  <div className="mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Draft Sheet</span>
                    <h3 className="text-base font-bold text-foreground font-serif">Home Pillars Section</h3>
                    <p className="text-[11px] text-muted-foreground">Eyebrow label for the home page pillars block.</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Eyebrow</Label>
                    <Input value={content.homePillars.eyebrow ?? ""} onChange={(e) => handleHomePillarsFieldChange("eyebrow", e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
              )}

              {activeTab === "pillars" && content?.pillars && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Draft Sheet</span>
                    <h3 className="text-base font-bold text-foreground font-serif">Core Pillars</h3>
                    <p className="text-[11px] text-muted-foreground">Modify structural information cards displayed across layout grids.</p>
                  </div>
                  {content.pillars.map((pillar: any, index: number) => (
                    <div key={pillar.id} className="relative bg-card border border-border rounded p-6 shadow-sm">
                      <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">
                        P0{index + 1}
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="sm:col-span-1 space-y-1">
                          <Label htmlFor={`p-id-${index}`} className="text-[10px] font-mono uppercase text-muted-foreground">ID Slug</Label>
                          <Input
                            id={`p-id-${index}`}
                            value={pillar.id ?? ""}
                            onChange={(e) => handlePillarChange(index, "id", e.target.value)}
                            className="font-mono text-xs text-muted-foreground"
                            placeholder="pillar-..."
                          />
                        </div>
                        <div className="sm:col-span-1 space-y-1">
                          <Label htmlFor={`p-icon-${index}`} className="text-[10px] font-mono uppercase text-muted-foreground">Icon Name (Lucide)</Label>
                          <Input
                            id={`p-icon-${index}`}
                            value={pillar.icon ?? ""}
                            onChange={(e) => handlePillarIconChange(index, e.target.value)}
                            className="font-mono text-xs text-muted-foreground"
                            placeholder="Users, Sparkles, ..."
                          />
                        </div>
                        <div className="sm:col-span-1 space-y-1">
                          <Label htmlFor={`p-title-${index}`} className="text-[10px] font-mono uppercase text-muted-foreground">Title Accent</Label>
                          <Input
                            id={`p-title-${index}`}
                            value={pillar.title}
                            onChange={(e) => handlePillarChange(index, "title", e.target.value)}
                            className="font-mono text-xs font-bold"
                          />
                        </div>
                        <div className="sm:col-span-3 space-y-1">
                          <Label htmlFor={`p-body-${index}`} className="text-[10px] font-mono uppercase text-muted-foreground">Supporting Content</Label>
                          <Input
                            id={`p-body-${index}`}
                            value={pillar.body}
                            onChange={(e) => handlePillarChange(index, "body", e.target.value)}
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "navbar" && content?.navbar && (
                <div className="space-y-6">
                  <div className="relative bg-card border border-border rounded p-6 shadow-sm">
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">
                      N01
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-[10px] font-mono uppercase text-muted-foreground">Module Scope</span>
                      <h3 className="text-sm font-bold text-foreground font-mono uppercase">Header wordmarks</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="nav-brandName" className="text-[10px] font-mono uppercase text-muted-foreground">Primary Brand Title</Label>
                        <Input
                          id="nav-brandName"
                          value={content.navbar.brandName}
                          onChange={(e) => handleFieldChange("navbar", "brandName", e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="nav-brandTagline" className="text-[10px] font-mono uppercase text-muted-foreground">Institutional Sub-Wordmark</Label>
                        <Input
                          id="nav-brandTagline"
                          value={content.navbar.brandTagline}
                          onChange={(e) => handleFieldChange("navbar", "brandTagline", e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Navigation Address Indexes</span>
                    {content.navbar.links.map((link: any, index: number) => (
                      <div key={index} className="relative bg-card border border-border rounded p-6 shadow-sm">
                        <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">
                          L0{index + 1}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-mono uppercase text-muted-foreground">Label Identifier</Label>
                            <Input
                              value={link.label}
                              onChange={(e) => handleNavbarLinkChange(index, "label", e.target.value)}
                              className="font-mono text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-mono uppercase text-muted-foreground">Dest path</Label>
                            <Input
                              value={link.href}
                              onChange={(e) => handleNavbarLinkChange(index, "href", e.target.value)}
                              className="font-mono text-xs text-muted-foreground"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "footerLabs" && content && (
                <div className="space-y-6">
                  {/* Brand Detail */}
                  <div className="relative bg-card border border-border rounded p-6 shadow-sm">
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">
                      F01
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-[10px] font-mono uppercase text-muted-foreground">Footer Context</span>
                      <h3 className="text-sm font-bold text-foreground font-serif">Brand bio metadata</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="footer-brand-name" className="text-[10px] font-mono uppercase text-muted-foreground">Title Label</Label>
                          <Input
                            id="footer-brand-name"
                            value={content.brand.name}
                            onChange={(e) => handleFieldChange("brand", "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="footer-brand-tag" className="text-[10px] font-mono uppercase text-muted-foreground">Tag Tagline</Label>
                          <Input
                            id="footer-brand-tag"
                            value={content.brand.tagline}
                            onChange={(e) => handleFieldChange("brand", "tagline", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="footer-brand-copyright" className="text-[10px] font-mono uppercase text-muted-foreground">Copyright Suffix</Label>
                        <Input
                          id="footer-brand-copyright"
                          value={content.brand.copyrightSuffix ?? ""}
                          onChange={(e) => handleFieldChange("brand", "copyrightSuffix", e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="footer-brand-desc" className="text-[10px] font-mono uppercase text-muted-foreground">Footer Editorial Paragraph</Label>
                        <textarea
                          id="footer-brand-desc"
                          rows={3}
                          value={content.brand.footerDescription}
                          onChange={(e) => handleFieldChange("brand", "footerDescription", e.target.value)}
                          className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social / Contact */}
                  <div className="relative bg-card border border-border rounded p-6 shadow-sm">
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">
                      F02
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-[10px] font-mono uppercase text-muted-foreground">Link Modules</span>
                      <h3 className="text-sm font-bold text-foreground font-mono uppercase">Social channels</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="social-x" className="text-[10px] font-mono uppercase text-muted-foreground">X (Twitter) URL</Label>
                        <Input
                          id="social-x"
                          value={content.socials.xUrl}
                          onChange={(e) => handleFieldChange("socials", "xUrl", e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="social-x-handle" className="text-[10px] font-mono uppercase text-muted-foreground">X Handle (@...)</Label>
                        <Input
                          id="social-x-handle"
                          value={content.socials.xHandle ?? ""}
                          onChange={(e) => handleFieldChange("socials", "xHandle", e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="social-email" className="text-[10px] font-mono uppercase text-muted-foreground">Contact Gateway Email</Label>
                        <Input
                          id="social-email"
                          type="email"
                          value={content.socials.email}
                          onChange={(e) => handleFieldChange("socials", "email", e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Research list */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Research Directories</span>
                    {content.researchLabs.items.map((lab: any, index: number) => (
                      <div key={index} className="relative bg-card border border-border rounded p-6 shadow-sm">
                        <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">
                          R0{index + 1}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-mono uppercase text-slate-500">Lab Identifier</Label>
                            <Input
                              value={lab.name}
                              onChange={(e) => handleListItemChange("researchLabs", index, "name", e.target.value)}
                              className="font-mono text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-mono uppercase text-slate-500">Hyperlink Destination</Label>
                            <Input
                              value={lab.url}
                              placeholder="No active target"
                              onChange={(e) => handleListItemChange("researchLabs", index, "url", e.target.value)}
                              className="font-mono text-xs text-muted-foreground"
                            />
                          </div>
                          <div className="flex flex-col justify-end">
                            <div className="flex items-center gap-2 pb-2">
                              <input
                                id={`lab-ext-${index}`}
                                type="checkbox"
                                checked={lab.isExternal}
                                onChange={(e) => handleListItemChange("researchLabs", index, "isExternal", e.target.checked)}
                                className="h-4 w-4 rounded border-border text-foreground focus:ring-ring bg-background"
                              />
                              <Label htmlFor={`lab-ext-${index}`} className="text-[10px] font-mono uppercase text-muted-foreground cursor-pointer select-none">
                                Open external target
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Campuses list */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Campus Portals</span>
                    {content.campuses.items.map((campus: any, index: number) => (
                      <div key={index} className="relative bg-card border border-border rounded p-6 shadow-sm">
                        <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">
                          C0{index + 1}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-mono uppercase text-muted-foreground">Campus Label</Label>
                            <Input
                              value={campus.name}
                              onChange={(e) => handleListItemChange("campuses", index, "name", e.target.value)}
                              className="font-mono text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-mono uppercase text-muted-foreground">Portal Target URL</Label>
                            <Input
                              value={campus.url}
                              onChange={(e) => handleListItemChange("campuses", index, "url", e.target.value)}
                              className="font-mono text-xs text-muted-foreground"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "location" && content?.location && (
                <div className="relative bg-card border border-border rounded p-6 shadow-sm">
                  <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">
                    L01
                  </div>

                  <div className="mb-6">
                    <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Physical Coordinates</h2>
                    <h3 className="text-base font-bold text-foreground font-serif">Spatial details</h3>
                    <p className="text-[11px] text-muted-foreground">Configure geolocation variables matching the studio campus.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="loc-heading" className="text-[10px] font-mono uppercase text-muted-foreground">Section Heading</Label>
                        <Input
                          id="loc-heading"
                          value={content.location.locationHeading ?? ""}
                          onChange={(e) => handleFieldChange("location", "locationHeading", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="loc-title" className="text-[10px] font-mono uppercase text-muted-foreground">Campus Name</Label>
                        <Input
                          id="loc-title"
                          value={content.location.title}
                          onChange={(e) => handleFieldChange("location", "title", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="loc-coords" className="text-[10px] font-mono uppercase text-muted-foreground">Grid Coordinates</Label>
                        <Input
                          id="loc-coords"
                          value={content.location.coordinates}
                          onChange={(e) => handleFieldChange("location", "coordinates", e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="loc-map-label" className="text-[10px] font-mono uppercase text-muted-foreground">Map Link Label</Label>
                        <Input
                          id="loc-map-label"
                          value={content.location.footerMapLabel ?? ""}
                          onChange={(e) => handleFieldChange("location", "footerMapLabel", e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="loc-inst" className="text-[10px] font-mono uppercase text-muted-foreground">Affiliation Institution</Label>
                      <Input
                        id="loc-inst"
                        value={content.location.institution}
                        onChange={(e) => handleFieldChange("location", "institution", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="loc-street" className="text-[10px] font-mono uppercase text-muted-foreground">Street Node</Label>
                        <Input
                          id="loc-street"
                          value={content.location.street}
                          onChange={(e) => handleFieldChange("location", "street", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="loc-city" className="text-[10px] font-mono uppercase text-muted-foreground">City / Country Node</Label>
                        <Input
                          id="loc-city"
                          value={content.location.cityCountry}
                          onChange={(e) => handleFieldChange("location", "cityCountry", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="loc-query" className="text-[10px] font-mono uppercase text-muted-foreground">Google Maps Query Hash</Label>
                      <Input
                        id="loc-query"
                        value={content.location.mapsQuery}
                        onChange={(e) => handleFieldChange("location", "mapsQuery", e.target.value)}
                        className="font-mono text-xs text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "marquee" && content?.marquee && (
                <div className="relative bg-card border border-border rounded p-6 shadow-sm">
                  <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">
                    M01
                  </div>
                  <div className="mb-6">
                    <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Marquee Band</h2>
                    <h3 className="text-base font-bold text-foreground font-serif">Scrolling keywords</h3>
                    <p className="text-[11px] text-muted-foreground">One keyword per line. These cycle across the marquee strip.</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Keywords (one per line)</Label>
                    <textarea
                      rows={12}
                      value={content.marquee.keywords.join("\n")}
                      onChange={(e) =>
                        setContent((prev: any) => ({
                          ...prev,
                          marquee: { keywords: e.target.value.split("\n").map((k: string) => k.trim()).filter(Boolean) },
                        }))
                      }
                      className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-mono leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {activeTab === "groupOverview" && content?.groupOverview && (
                <div className="space-y-4">
                  <div className="mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Draft Sheet</span>
                    <h3 className="text-base font-bold text-foreground font-serif">Group Overview Section</h3>
                  </div>

                  <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">G01</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Eyebrow Label</Label>
                        <Input value={content.groupOverview.eyebrow} onChange={(e) => handleFieldChange("groupOverview", "eyebrow", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Location Chip</Label>
                        <Input value={content.groupOverview.locationChip} onChange={(e) => handleFieldChange("groupOverview", "locationChip", e.target.value)} className="font-mono text-xs" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Headline</Label>
                      <Input value={content.groupOverview.headline} onChange={(e) => handleFieldChange("groupOverview", "headline", e.target.value)} className="font-serif font-bold" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Body Paragraph</Label>
                      <textarea
                        rows={5}
                        value={content.groupOverview.body}
                        onChange={(e) => handleFieldChange("groupOverview", "body", e.target.value)}
                        className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Profile Panel Label ("Glance")</Label>
                      <Input value={content.groupOverview.glanceLabel} onChange={(e) => handleFieldChange("groupOverview", "glanceLabel", e.target.value)} className="font-mono text-xs" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Focus Cards</span>
                    {content.groupOverview.focusCards.map((card: any, index: number) => (
                      <div key={index} className="relative bg-card border border-border rounded p-5 shadow-sm">
                        <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">F0{index + 1}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-mono uppercase text-muted-foreground">Title</Label>
                            <Input value={card.title} onChange={(e) => {
                              const updated = [...content.groupOverview.focusCards];
                              updated[index] = { ...updated[index], title: e.target.value };
                              setContent((prev: any) => ({ ...prev, groupOverview: { ...prev.groupOverview, focusCards: updated } }));
                            }} className="font-mono text-xs" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-mono uppercase text-muted-foreground">Label Tag</Label>
                            <Input value={card.label} onChange={(e) => {
                              const updated = [...content.groupOverview.focusCards];
                              updated[index] = { ...updated[index], label: e.target.value };
                              setContent((prev: any) => ({ ...prev, groupOverview: { ...prev.groupOverview, focusCards: updated } }));
                            }} className="font-mono text-xs" />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-[10px] font-mono uppercase text-muted-foreground">Description</Label>
                            <Input value={card.description} onChange={(e) => {
                              const updated = [...content.groupOverview.focusCards];
                              updated[index] = { ...updated[index], description: e.target.value };
                              setContent((prev: any) => ({ ...prev, groupOverview: { ...prev.groupOverview, focusCards: updated } }));
                            }} className="text-xs" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "professor" && content?.professor && (
                <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                  <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">P01</div>
                  <div className="mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Draft Sheet</span>
                    <h3 className="text-base font-bold text-foreground font-serif">Professor Profile</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Full Name</Label>
                      <Input value={content.professor.name} onChange={(e) => handleFieldChange("professor", "name", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Title</Label>
                      <Input value={content.professor.title} onChange={(e) => handleFieldChange("professor", "title", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Department</Label>
                      <Input value={content.professor.department} onChange={(e) => handleFieldChange("professor", "department", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Institution</Label>
                      <Input value={content.professor.institution} onChange={(e) => handleFieldChange("professor", "institution", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Additional Role</Label>
                      <Input value={content.professor.role} onChange={(e) => handleFieldChange("professor", "role", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Website URL</Label>
                      <Input value={content.professor.website} onChange={(e) => handleFieldChange("professor", "website", e.target.value)} className="font-mono text-xs text-muted-foreground" />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Profile Image Path (from /public/headshots)</Label>
                      <Input value={content.professor.imagePath} onChange={(e) => handleFieldChange("professor", "imagePath", e.target.value)} className="font-mono text-xs text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Bio</Label>
                    <textarea
                      rows={6}
                      value={content.professor.bio ?? ""}
                      onChange={(e) => handleFieldChange("professor", "bio", e.target.value)}
                      className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Areas of Interest (one per line)</Label>
                    <textarea
                      rows={4}
                      value={(content.professor.areasOfInterest ?? []).join("\n")}
                      onChange={(e) => handleAreasOfInterestChange(e.target.value)}
                      className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-mono leading-relaxed"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Research Interests (long form)</Label>
                    <textarea
                      rows={5}
                      value={content.professor.researchInterests ?? ""}
                      onChange={(e) => handleFieldChange("professor", "researchInterests", e.target.value)}
                      className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Venue Word (e.g. "Website")</Label>
                      <Input value={content.professor.venueWord ?? ""} onChange={(e) => handleFieldChange("professor", "venueWord", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Profile Detail Eyebrow</Label>
                      <Input value={content.professor.profileDetailEyebrow ?? ""} onChange={(e) => handleFieldChange("professor", "profileDetailEyebrow", e.target.value)} className="font-mono text-xs" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "researchDomains" && content?.researchDomains && (
                <div className="space-y-4">
                  <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">R01</div>
                    <div className="mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Draft Sheet</span>
                      <h3 className="text-base font-bold text-foreground font-serif">Research Domains Bento Grid</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Section Label</Label>
                        <Input value={content.researchDomains.sectionLabel} onChange={(e) => handleFieldChange("researchDomains", "sectionLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Status Badge</Label>
                        <Input value={content.researchDomains.statusLabel} onChange={(e) => handleFieldChange("researchDomains", "statusLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Domain Cards</span>
                  {content.researchDomains.items.map((item: any, index: number) => (
                    <div key={index} className="relative bg-card border border-border rounded p-5 shadow-sm">
                      <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">D0{index + 1}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Title</Label>
                          <Input value={item.title} onChange={(e) => handleListItemChange("researchDomains", index, "title", e.target.value)} className="font-mono text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Icon Name</Label>
                          <Input value={item.icon} onChange={(e) => handleListItemChange("researchDomains", index, "icon", e.target.value)} className="font-mono text-xs text-muted-foreground" />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Description</Label>
                          <Input value={item.description} onChange={(e) => handleListItemChange("researchDomains", index, "description", e.target.value)} className="text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Col Span (Tailwind classes)</Label>
                          <Input value={item.colSpan ?? ""} onChange={(e) => handleResearchDomainColSpanChange(index, e.target.value)} placeholder="md:col-span-2" className="font-mono text-xs text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Accent (primary | accent)</Label>
                          <Input value={item.accent ?? ""} onChange={(e) => handleResearchDomainAccentChange(index, e.target.value)} placeholder="primary" className="font-mono text-xs text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "about" && content?.about && (
                <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                  <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">A01</div>
                  <div className="mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Draft Sheet</span>
                    <h3 className="text-base font-bold text-foreground font-serif">About the Group Section</h3>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Section Title</Label>
                    <Input value={content.about.title} onChange={(e) => handleFieldChange("about", "title", e.target.value)} className="font-mono text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Body Paragraph</Label>
                    <textarea
                      rows={5}
                      value={content.about.body}
                      onChange={(e) => handleFieldChange("about", "body", e.target.value)}
                      className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">CTA Label</Label>
                      <Input value={content.about.ctaLabel ?? ""} onChange={(e) => handleFieldChange("about", "ctaLabel", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">CTA Href</Label>
                      <Input value={content.about.ctaHref ?? "/about"} onChange={(e) => handleFieldChange("about", "ctaHref", e.target.value)} className="font-mono text-xs" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "team" && content?.team && (
                <div className="space-y-6">
                  <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">T01</div>
                    <h3 className="text-base font-bold text-foreground font-serif">Team Page Header</h3>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Eyebrow</Label>
                      <Input value={content.team.pageEyebrow} onChange={(e) => handleFieldChange("team", "pageEyebrow", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Headline</Label>
                      <Input value={content.team.pageHeadline} onChange={(e) => handleFieldChange("team", "pageHeadline", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Body</Label>
                      <textarea rows={3} value={content.team.pageBody} onChange={(e) => handleFieldChange("team", "pageBody", e.target.value)} className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed" />
                    </div>
                  </div>

                  {content.team.sections?.map((section: any, sectionIndex: number) => (
                    <div key={`section-${sectionIndex}`} className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                      <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">T0{sectionIndex + 2}</div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-foreground font-serif">{section.role}</h3>
                        <Button size="xs" variant="outline" onClick={() => handleTeamMemberAdd(sectionIndex)}>
                          <Plus className="h-3 w-3" /> Add Member
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {(section.members ?? []).map((member: any, memberIndex: number) => (
                          <div key={`member-${memberIndex}`} className="rounded border border-border bg-muted/30 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] uppercase text-muted-foreground">{member.name || `Member ${memberIndex + 1}`}</span>
                              <Button size="xs" variant="ghost" onClick={() => handleTeamMemberRemove(sectionIndex, memberIndex)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-mono uppercase text-muted-foreground">Name</Label>
                                <Input value={member.name ?? ""} onChange={(e) => handleTeamMemberChange(sectionIndex, memberIndex, "name", e.target.value)} className="font-mono text-xs" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-mono uppercase text-muted-foreground">Title</Label>
                                <Input value={member.title ?? ""} onChange={(e) => handleTeamMemberChange(sectionIndex, memberIndex, "title", e.target.value)} className="font-mono text-xs" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-mono uppercase text-muted-foreground">Focus</Label>
                                <Input value={member.focus ?? ""} onChange={(e) => handleTeamMemberChange(sectionIndex, memberIndex, "focus", e.target.value)} className="font-mono text-xs" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-mono uppercase text-muted-foreground">Image Path</Label>
                                <Input value={member.imagePath ?? ""} onChange={(e) => handleTeamMemberChange(sectionIndex, memberIndex, "imagePath", e.target.value)} className="font-mono text-xs" placeholder="/headshots/name.png" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-mono uppercase text-muted-foreground">Website</Label>
                              <Input value={member.website ?? ""} onChange={(e) => handleTeamMemberChange(sectionIndex, memberIndex, "website", e.target.value)} placeholder="https://..." className="font-mono text-xs" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-mono uppercase text-muted-foreground">Profile Detail Eyebrow</Label>
                              <Input value={member.profileDetailEyebrow ?? ""} onChange={(e) => handleTeamMemberChange(sectionIndex, memberIndex, "profileDetailEyebrow", e.target.value)} className="font-mono text-xs" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-mono uppercase text-muted-foreground">Bio</Label>
                              <textarea
                                rows={4}
                                value={member.bio ?? ""}
                                onChange={(e) => handleTeamProfileFieldChange(sectionIndex, memberIndex, "bio", e.target.value)}
                                className="w-full text-xs p-2 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-mono uppercase text-muted-foreground">Areas of Interest (one per line)</Label>
                              <textarea
                                rows={2}
                                value={(member.areasOfInterest ?? []).join("\n")}
                                onChange={(e) => handleTeamProfileFieldChange(sectionIndex, memberIndex, "areasOfInterest", e.target.value)}
                                className="w-full text-xs p-2 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-mono leading-relaxed"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-mono uppercase text-muted-foreground">Research Interests</Label>
                              <textarea
                                rows={4}
                                value={member.researchInterests ?? ""}
                                onChange={(e) => handleTeamProfileFieldChange(sectionIndex, memberIndex, "researchInterests", e.target.value)}
                                className="w-full text-xs p-2 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-mono uppercase text-muted-foreground">Links</Label>
                                <Button size="xs" variant="ghost" onClick={() => handleTeamMemberLinkAdd(sectionIndex, memberIndex)}>
                                  <Plus className="h-3 w-3" /> Link
                                </Button>
                              </div>
                              {(member.links ?? []).map((link: any, linkIndex: number) => (
                                <div key={`link-${linkIndex}`} className="grid grid-cols-2 gap-2">
                                  <Input value={link.label ?? ""} onChange={(e) => handleTeamMemberLinkChange(sectionIndex, memberIndex, linkIndex, "label", e.target.value)} placeholder="Label" className="font-mono text-xs" />
                                  <Input value={link.url ?? ""} onChange={(e) => handleTeamMemberLinkChange(sectionIndex, memberIndex, linkIndex, "url", e.target.value)} placeholder="https://..." className="font-mono text-xs" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">T99</div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-foreground font-serif">Lab Alumni</h3>
                      <Button size="xs" variant="outline" onClick={handleAlumniAdd}>
                        <Plus className="h-3 w-3" /> Add Alumni
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(content.team.alumni.members ?? []).map((alum: any, idx: number) => (
                        <div key={`alum-${idx}`} className="rounded border border-border bg-muted/30 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase text-muted-foreground">{alum.name || `Alumni ${idx + 1}`}</span>
                            <Button size="xs" variant="ghost" onClick={() => handleAlumniRemove(idx)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input value={alum.name ?? ""} onChange={(e) => handleAlumniChange(idx, "name", e.target.value)} placeholder="Name" className="font-mono text-xs" />
                            <Input value={alum.role ?? ""} onChange={(e) => handleAlumniChange(idx, "role", e.target.value)} placeholder="Role (e.g. PhD)" className="font-mono text-xs" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input value={alum.currentPosition ?? ""} onChange={(e) => handleAlumniChange(idx, "currentPosition", e.target.value)} placeholder="Current position" className="font-mono text-xs" />
                            <Input value={alum.currentAffiliation ?? ""} onChange={(e) => handleAlumniChange(idx, "currentAffiliation", e.target.value)} placeholder="Current affiliation" className="font-mono text-xs" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">T88</div>
                    <h3 className="text-base font-bold text-foreground font-serif">Team Page Strings</h3>
                    <p className="text-[11px] text-muted-foreground">Pluralization, count labels, and other team-page copy.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Page Title</Label>
                        <Input value={content.team.pageTitle ?? ""} onChange={(e) => handleFieldChange("team", "pageTitle", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">PI Role Label</Label>
                        <Input value={content.team.principalInvestigatorRole ?? ""} onChange={(e) => handleFieldChange("team", "principalInvestigatorRole", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Hero Roster Word</Label>
                        <Input value={content.team.heroRosterWord ?? ""} onChange={(e) => handleFieldChange("team", "heroRosterWord", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">PI Row Bio Glance</Label>
                        <Input value={content.team.piRowBioGlance ?? ""} onChange={(e) => handleFieldChange("team", "piRowBioGlance", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Active Member (singular)</Label>
                        <Input value={content.team.activeMembersWordSingular ?? ""} onChange={(e) => handleFieldChange("team", "activeMembersWordSingular", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Active Members (plural)</Label>
                        <Input value={content.team.activeMembersWordPlural ?? ""} onChange={(e) => handleFieldChange("team", "activeMembersWordPlural", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Section (singular)</Label>
                        <Input value={content.team.sectionsCountSingular ?? ""} onChange={(e) => handleFieldChange("team", "sectionsCountSingular", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Sections (plural)</Label>
                        <Input value={content.team.sectionsCountPlural ?? ""} onChange={(e) => handleFieldChange("team", "sectionsCountPlural", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Member (singular)</Label>
                        <Input value={content.team.membersCountSingular ?? ""} onChange={(e) => handleFieldChange("team", "membersCountSingular", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Members (plural)</Label>
                        <Input value={content.team.membersCountPlural ?? ""} onChange={(e) => handleFieldChange("team", "membersCountPlural", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Members Dash</Label>
                        <Input value={content.team.membersDash ?? ""} onChange={(e) => handleFieldChange("team", "membersDash", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Alumnus (singular)</Label>
                        <Input value={content.team.alumniCountSingular ?? ""} onChange={(e) => handleFieldChange("team", "alumniCountSingular", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Alumni (plural)</Label>
                        <Input value={content.team.alumniCountPlural ?? ""} onChange={(e) => handleFieldChange("team", "alumniCountPlural", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Empty Role Message</Label>
                        <Input value={content.team.emptyRoleMessage ?? ""} onChange={(e) => handleFieldChange("team", "emptyRoleMessage", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Empty Alumni Message</Label>
                        <Input value={content.team.emptyAlumniMessage ?? ""} onChange={(e) => handleFieldChange("team", "emptyAlumniMessage", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Homepage Link Label</Label>
                        <Input value={content.team.homepageLinkLabel ?? ""} onChange={(e) => handleFieldChange("team", "homepageLinkLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Profile Detail Name Label</Label>
                        <Input value={content.team.profileDetailNameLabel ?? ""} onChange={(e) => handleFieldChange("team", "profileDetailNameLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Profile Detail Bio Label</Label>
                        <Input value={content.team.profileDetailBioLabel ?? ""} onChange={(e) => handleFieldChange("team", "profileDetailBioLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Profile Detail Areas Label</Label>
                        <Input value={content.team.profileDetailAreasLabel ?? ""} onChange={(e) => handleFieldChange("team", "profileDetailAreasLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Profile Detail Research Label</Label>
                        <Input value={content.team.profileDetailResearchLabel ?? ""} onChange={(e) => handleFieldChange("team", "profileDetailResearchLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Profile Detail Website Label</Label>
                        <Input value={content.team.profileDetailWebsiteLabel ?? ""} onChange={(e) => handleFieldChange("team", "profileDetailWebsiteLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Profile Close Label</Label>
                        <Input value={content.team.profileCloseLabel ?? ""} onChange={(e) => handleFieldChange("team", "profileCloseLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Profile Open Label</Label>
                        <Input value={content.team.profileOpenLabel ?? ""} onChange={(e) => handleFieldChange("team", "profileOpenLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Alumni Title</Label>
                        <Input value={content.team.alumni?.title ?? ""} onChange={(e) => setContent((prev: any) => ({ ...prev, team: { ...prev.team, alumni: { ...prev.team.alumni, title: e.target.value } } }))} className="font-mono text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "publications" && content?.publications && (
                <div className="space-y-6">
                  <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">P01</div>
                    <h3 className="text-base font-bold text-foreground font-serif">Publications Header</h3>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Page Title</Label>
                      <Input value={content.publications.pageTitle ?? ""} onChange={(e) => handlePublicationFieldChange("pageTitle", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Page Subhead</Label>
                      <textarea rows={2} value={content.publications.pageSubhead ?? ""} onChange={(e) => handlePublicationFieldChange("pageSubhead", e.target.value)} className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Eyebrow</Label>
                        <Input value={content.publications.pageEyebrow} onChange={(e) => handleFieldChange("publications", "pageEyebrow", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Headline</Label>
                        <Input value={content.publications.pageHeadline} onChange={(e) => handleFieldChange("publications", "pageHeadline", e.target.value)} className="font-mono text-xs" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Section Label (Books)</Label>
                        <Input value={content.publications.sectionLabel ?? ""} onChange={(e) => handlePublicationFieldChange("sectionLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Section Monograph Title</Label>
                        <Input value={content.publications.sectionMonographTitle ?? ""} onChange={(e) => handlePublicationFieldChange("sectionMonographTitle", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Section Title Template</Label>
                        <Input value={content.publications.sectionTitleTemplate ?? ""} onChange={(e) => handlePublicationFieldChange("sectionTitleTemplate", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Row Type Label</Label>
                        <Input value={content.publications.rowTypeLabel ?? ""} onChange={(e) => handlePublicationFieldChange("rowTypeLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">DOI Prefix</Label>
                        <Input value={content.publications.doiPrefix ?? ""} onChange={(e) => handlePublicationFieldChange("doiPrefix", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Index Word</Label>
                        <Input value={content.publications.indexWord ?? ""} onChange={(e) => handlePublicationFieldChange("indexWord", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Book Cover Placeholder</Label>
                        <Input value={content.publications.bookCoverPlaceholder ?? ""} onChange={(e) => handlePublicationFieldChange("bookCoverPlaceholder", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Article Prefix</Label>
                        <Input value={content.publications.articlePrefix ?? ""} onChange={(e) => handlePublicationFieldChange("articlePrefix", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Award Badge Label</Label>
                        <Input value={content.publications.awardBadgeLabel ?? ""} onChange={(e) => handlePublicationFieldChange("awardBadgeLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Venues Label</Label>
                        <Input value={content.publications.venuesLabel ?? ""} onChange={(e) => handlePublicationFieldChange("venuesLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">View Paper Label</Label>
                        <Input value={content.publications.viewPaperLabel ?? ""} onChange={(e) => handlePublicationFieldChange("viewPaperLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Empty Message</Label>
                        <Input value={content.publications.emptyMessage ?? ""} onChange={(e) => handlePublicationFieldChange("emptyMessage", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Entry (singular)</Label>
                        <Input value={content.publications.entriesCountSingular ?? ""} onChange={(e) => handlePublicationFieldChange("entriesCountSingular", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Entries (plural)</Label>
                        <Input value={content.publications.entriesCountPlural ?? ""} onChange={(e) => handlePublicationFieldChange("entriesCountPlural", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Title (singular)</Label>
                        <Input value={content.publications.titlesCountSingular ?? ""} onChange={(e) => handlePublicationFieldChange("titlesCountSingular", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Titles (plural)</Label>
                        <Input value={content.publications.titlesCountPlural ?? ""} onChange={(e) => handlePublicationFieldChange("titlesCountPlural", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Year (singular)</Label>
                        <Input value={content.publications.yearSingular ?? ""} onChange={(e) => handlePublicationFieldChange("yearSingular", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Years (plural)</Label>
                        <Input value={content.publications.yearPlural ?? ""} onChange={(e) => handlePublicationFieldChange("yearPlural", e.target.value)} className="font-mono text-xs" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Subsection Titles</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Journal Articles</Label>
                          <Input value={content.publications.subsectionTitles?.journalArticles ?? ""} onChange={(e) => handlePublicationSubsectionChange("journalArticles", e.target.value)} className="font-mono text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Conference Proceedings</Label>
                          <Input value={content.publications.subsectionTitles?.conferenceProceedings ?? ""} onChange={(e) => handlePublicationSubsectionChange("conferenceProceedings", e.target.value)} className="font-mono text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Extended Abstracts</Label>
                          <Input value={content.publications.subsectionTitles?.extendedAbstracts ?? ""} onChange={(e) => handlePublicationSubsectionChange("extendedAbstracts", e.target.value)} className="font-mono text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Research Artifacts</Label>
                          <Input value={content.publications.subsectionTitles?.researchArtifacts ?? ""} onChange={(e) => handlePublicationSubsectionChange("researchArtifacts", e.target.value)} className="font-mono text-xs" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">P02</div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-foreground font-serif">Books</h3>
                      <Button size="xs" variant="outline" onClick={handleBookAdd}>
                        <Plus className="h-3 w-3" /> Add Book
                      </Button>
                    </div>
                    {(content.publications.books ?? []).map((book: any, idx: number) => (
                      <div key={`book-${idx}`} className="rounded border border-border bg-muted/30 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] uppercase text-muted-foreground">{book.title || `Book ${idx + 1}`}</span>
                          <Button size="xs" variant="ghost" onClick={() => handleBookRemove(idx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input value={book.title ?? ""} onChange={(e) => handleBookChange(idx, "title", e.target.value)} placeholder="Title" className="font-mono text-xs" />
                          <Input value={book.authors ?? ""} onChange={(e) => handleBookChange(idx, "authors", e.target.value)} placeholder="Authors" className="font-mono text-xs" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Input value={book.year ?? ""} onChange={(e) => handleBookChange(idx, "year", e.target.value)} placeholder="Year" className="font-mono text-xs" />
                          <Input value={book.url ?? ""} onChange={(e) => handleBookChange(idx, "url", e.target.value)} placeholder="URL" className="font-mono text-xs col-span-2" />
                        </div>
                        <Input value={book.coverImagePath ?? ""} onChange={(e) => handleBookChange(idx, "coverImagePath", e.target.value)} placeholder="Cover image path (/public/...)" className="font-mono text-xs" />
                        <textarea rows={2} value={book.description ?? ""} onChange={(e) => handleBookChange(idx, "description", e.target.value)} placeholder="Description" className="w-full text-xs p-2 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed" />
                      </div>
                    ))}
                  </div>

                  <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">P03</div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-foreground font-serif">Year-grouped Publications</h3>
                      <Button size="xs" variant="outline" onClick={handleYearAdd}>
                        <Plus className="h-3 w-3" /> Add Year
                      </Button>
                    </div>

                    {Object.keys(content.publications.years ?? {}).sort((a, b) => (a < b ? 1 : -1)).map((year) => (
                      <div key={`year-${year}`} className="rounded border border-border bg-muted/30 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] uppercase text-muted-foreground">{year}</span>
                            <Input
                              value={content.publications.years[year]?.label ?? year}
                              onChange={(e) => setContent((prev: any) => {
                                const years = { ...prev.publications.years };
                                years[year] = { ...(years[year] ?? {}), label: e.target.value };
                                return { ...prev, publications: { ...prev.publications, years } };
                              })}
                              placeholder="Year label"
                              className="h-7 w-32 text-[10px] font-mono"
                            />
                          </div>
                          <Button size="xs" variant="ghost" onClick={() => handleYearRemove(year)}>
                            <Trash2 className="h-3 w-3" /> Remove year
                          </Button>
                        </div>
                        {(["journalArticles", "conferenceProceedings", "extendedAbstracts", "researchArtifacts"] as const).map((kind) => (
                          <div key={`${year}-${kind}`} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] uppercase text-muted-foreground">{kind}</span>
                              <Button size="xs" variant="ghost" onClick={() => handlePubAdd(year, kind)}>
                                <Plus className="h-3 w-3" /> Add
                              </Button>
                            </div>
                            {((content.publications.years[year] ?? {})[kind] ?? []).map((entry: any, idx: number) => (
                              <div key={`${year}-${kind}-${idx}`} className="rounded border border-border bg-card p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-muted-foreground">{entry.title || `Entry ${idx + 1}`}</span>
                                  <Button size="xs" variant="ghost" onClick={() => handlePubRemove(year, kind, idx)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input value={entry.authors ?? ""} onChange={(e) => handlePubChange(year, kind, idx, "authors", e.target.value)} placeholder="Authors" className="font-mono text-xs" />
                                  <Input value={entry.title ?? ""} onChange={(e) => handlePubChange(year, kind, idx, "title", e.target.value)} placeholder="Title" className="font-mono text-xs" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input value={entry.venue ?? ""} onChange={(e) => handlePubChange(year, kind, idx, "venue", e.target.value)} placeholder="Venue" className="font-mono text-xs" />
                                  <Input value={entry.url ?? ""} onChange={(e) => handlePubChange(year, kind, idx, "url", e.target.value)} placeholder="URL" className="font-mono text-xs" />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <Input value={entry.doi ?? ""} onChange={(e) => handlePubChange(year, kind, idx, "doi", e.target.value)} placeholder="DOI" className="font-mono text-xs" />
                                  <Input value={entry.pages ?? ""} onChange={(e) => handlePubChange(year, kind, idx, "pages", e.target.value)} placeholder="Pages" className="font-mono text-xs" />
                                  <Input value={entry.articleNumber ?? ""} onChange={(e) => handlePubChange(year, kind, idx, "articleNumber", e.target.value)} placeholder="Article #" className="font-mono text-xs" />
                                </div>
                                <Input value={entry.award ?? ""} onChange={(e) => handlePubAwardChange(year, kind, idx, e.target.value)} placeholder="Award (optional, e.g. Best Paper Honorable Mention)" className="font-mono text-xs" />
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "aboutPage" && content?.aboutPage && (
                <div className="space-y-6">
                  <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">B01</div>
                    <h3 className="text-base font-bold text-foreground font-serif">About Page Hero</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Page Title</Label>
                        <Input value={content.aboutPage.pageTitle ?? ""} onChange={(e) => handleFieldChange("aboutPage", "pageTitle", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Hero Badge</Label>
                        <Input value={content.aboutPage.heroBadge ?? ""} onChange={(e) => handleFieldChange("aboutPage", "heroBadge", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Hero Location Chip</Label>
                        <Input value={content.aboutPage.heroLocationChip ?? ""} onChange={(e) => handleFieldChange("aboutPage", "heroLocationChip", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Meta Vol Line</Label>
                        <Input value={content.aboutPage.metaVolLine ?? ""} onChange={(e) => handleFieldChange("aboutPage", "metaVolLine", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Field Notes Label</Label>
                        <Input value={content.aboutPage.fieldNotesLabel ?? ""} onChange={(e) => handleFieldChange("aboutPage", "fieldNotesLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Get In Touch Label</Label>
                        <Input value={content.aboutPage.getInTouchLabel ?? ""} onChange={(e) => handleFieldChange("aboutPage", "getInTouchLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Affiliations Eyebrow</Label>
                        <Input value={content.aboutPage.affiliationsEyebrow ?? ""} onChange={(e) => handleFieldChange("aboutPage", "affiliationsEyebrow", e.target.value)} className="font-mono text-xs" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Eyebrow</Label>
                      <Input value={content.aboutPage.eyebrow ?? ""} onChange={(e) => handleFieldChange("aboutPage", "eyebrow", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Headline</Label>
                      <Input value={content.aboutPage.headline ?? ""} onChange={(e) => handleFieldChange("aboutPage", "headline", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Subhead</Label>
                      <textarea rows={3} value={content.aboutPage.subhead ?? ""} onChange={(e) => handleFieldChange("aboutPage", "subhead", e.target.value)} className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Hero Headline Line 1</Label>
                      <Input value={content.aboutPage.heroHeadlineLine1 ?? ""} onChange={(e) => handleFieldChange("aboutPage", "heroHeadlineLine1", e.target.value)} className="font-serif font-bold" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Hero Headline Line 2</Label>
                      <Input value={content.aboutPage.heroHeadlineLine2 ?? ""} onChange={(e) => handleFieldChange("aboutPage", "heroHeadlineLine2", e.target.value)} className="font-serif" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Hero Headline Line 3 (accent)</Label>
                      <Input value={content.aboutPage.heroHeadlineLine3 ?? ""} onChange={(e) => handleFieldChange("aboutPage", "heroHeadlineLine3", e.target.value)} className="font-serif" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Hero Sub Paragraph</Label>
                      <textarea rows={3} value={content.aboutPage.heroSubParagraph ?? ""} onChange={(e) => handleFieldChange("aboutPage", "heroSubParagraph", e.target.value)} className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Hero Primary Action Text</Label>
                      <Input value={content.aboutPage.heroPrimaryActionText ?? ""} onChange={(e) => handleFieldChange("aboutPage", "heroPrimaryActionText", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Hero Research Posture Label</Label>
                      <Input value={content.aboutPage.heroResearchPostureLabel ?? ""} onChange={(e) => handleFieldChange("aboutPage", "heroResearchPostureLabel", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Hero Research Posture Body</Label>
                      <textarea rows={2} value={content.aboutPage.heroResearchPostureBody ?? ""} onChange={(e) => handleFieldChange("aboutPage", "heroResearchPostureBody", e.target.value)} className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Hero Methods Label</Label>
                        <Input value={content.aboutPage.heroMethodsLabel ?? ""} onChange={(e) => handleFieldChange("aboutPage", "heroMethodsLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Hero Methods Value</Label>
                        <Input value={content.aboutPage.heroMethodsValue ?? ""} onChange={(e) => handleFieldChange("aboutPage", "heroMethodsValue", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Hero Focus Label</Label>
                        <Input value={content.aboutPage.heroFocusLabel ?? ""} onChange={(e) => handleFieldChange("aboutPage", "heroFocusLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Hero Focus Value</Label>
                        <Input value={content.aboutPage.heroFocusValue ?? ""} onChange={(e) => handleFieldChange("aboutPage", "heroFocusValue", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Hero Group Photo Path</Label>
                        <Input value={content.aboutPage.heroGroupPhotoPath ?? ""} onChange={(e) => handleFieldChange("aboutPage", "heroGroupPhotoPath", e.target.value)} placeholder="/group-photos/..." className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Hero Group Photo Alt</Label>
                        <Input value={content.aboutPage.heroGroupPhotoAlt ?? ""} onChange={(e) => handleFieldChange("aboutPage", "heroGroupPhotoAlt", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Methods (singular)</Label>
                        <Input value={content.aboutPage.methodsCountSingular ?? ""} onChange={(e) => handleFieldChange("aboutPage", "methodsCountSingular", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Methods (plural)</Label>
                        <Input value={content.aboutPage.methodsCountPlural ?? ""} onChange={(e) => handleFieldChange("aboutPage", "methodsCountPlural", e.target.value)} className="font-mono text-xs" />
                      </div>
                    </div>
                  </div>

                  <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">B02</div>
                    <h3 className="text-base font-bold text-foreground font-serif">About Page Body</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Mission Title</Label>
                        <Input value={content.aboutPage.missionTitle ?? ""} onChange={(e) => handleFieldChange("aboutPage", "missionTitle", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Approach Title</Label>
                        <Input value={content.aboutPage.approachTitle ?? ""} onChange={(e) => handleFieldChange("aboutPage", "approachTitle", e.target.value)} className="font-mono text-xs" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Mission Body</Label>
                      <textarea rows={4} value={content.aboutPage.missionBody ?? ""} onChange={(e) => handleFieldChange("aboutPage", "missionBody", e.target.value)} className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Approach Body</Label>
                      <textarea rows={4} value={content.aboutPage.approachBody ?? ""} onChange={(e) => handleFieldChange("aboutPage", "approachBody", e.target.value)} className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Story Title</Label>
                      <Input value={content.aboutPage.storyTitle ?? ""} onChange={(e) => handleFieldChange("aboutPage", "storyTitle", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Story Body</Label>
                      <textarea rows={5} value={content.aboutPage.storyBody ?? ""} onChange={(e) => handleFieldChange("aboutPage", "storyBody", e.target.value)} className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Approach Items</Label>
                        <Button size="xs" variant="ghost" onClick={handleApproachItemAdd}>
                          <Plus className="h-3 w-3" /> Add
                        </Button>
                      </div>
                      {(content.aboutPage.approachItems ?? []).map((item: any, idx: number) => (
                        <div key={`approach-${idx}`} className="rounded border border-border bg-muted/30 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase text-muted-foreground">{item.title || `Item ${idx + 1}`}</span>
                            <Button size="xs" variant="ghost" onClick={() => handleApproachItemRemove(idx)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <Input value={item.title ?? ""} onChange={(e) => handleApproachItemChange(idx, "title", e.target.value)} placeholder="Title" className="font-mono text-xs" />
                          <textarea rows={2} value={item.body ?? ""} onChange={(e) => handleApproachItemChange(idx, "body", e.target.value)} placeholder="Body" className="w-full text-xs p-2 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "contact" && content?.contact && (
                <div className="space-y-6">
                  <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">C01</div>
                    <h3 className="text-base font-bold text-foreground font-serif">Contact Page</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Page Title</Label>
                        <Input value={content.contact.pageTitle ?? ""} onChange={(e) => handleFieldChange("contact", "pageTitle", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Personal Site Label</Label>
                        <Input value={content.contact.personalSiteLabel ?? ""} onChange={(e) => handleFieldChange("contact", "personalSiteLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Email Label</Label>
                        <Input value={content.contact.emailLabel ?? ""} onChange={(e) => handleFieldChange("contact", "emailLabel", e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Connect Title</Label>
                        <Input value={content.contact.connectTitle ?? ""} onChange={(e) => handleFieldChange("contact", "connectTitle", e.target.value)} className="font-mono text-xs" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Eyebrow</Label>
                      <Input value={content.contact.eyebrow ?? ""} onChange={(e) => handleFieldChange("contact", "eyebrow", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Headline</Label>
                      <Input value={content.contact.headline ?? ""} onChange={(e) => handleFieldChange("contact", "headline", e.target.value)} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Body</Label>
                      <textarea rows={3} value={content.contact.body ?? ""} onChange={(e) => handleFieldChange("contact", "body", e.target.value)} className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Connect Body</Label>
                      <textarea rows={4} value={content.contact.connectBody ?? ""} onChange={(e) => handleFieldChange("contact", "connectBody", e.target.value)} className="w-full text-xs p-3 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Response Time</Label>
                      <Input value={content.contact.responseTime ?? ""} onChange={(e) => handleFieldChange("contact", "responseTime", e.target.value)} className="font-mono text-xs" />
                    </div>
                  </div>

                  <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[9px] text-muted-foreground">C02</div>
                    <h3 className="text-base font-bold text-foreground font-serif">Contact Section & Row Labels</h3>
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Sections</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Direct Channels</Label>
                          <Input value={content.contact.sections?.directChannels ?? ""} onChange={(e) => handleContactSectionChange("directChannels", e.target.value)} className="font-mono text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Find Us Online</Label>
                          <Input value={content.contact.sections?.findUsOnline ?? ""} onChange={(e) => handleContactSectionChange("findUsOnline", e.target.value)} className="font-mono text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Working With Us</Label>
                          <Input value={content.contact.sections?.workingWithUs ?? ""} onChange={(e) => handleContactSectionChange("workingWithUs", e.target.value)} className="font-mono text-xs" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Rows</span>
                      {(["email", "office", "principalInvestigator"] as const).map((rowKey) => (
                        <div key={rowKey} className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-mono uppercase text-muted-foreground">{rowKey} · Icon</Label>
                            <Input value={content.contact.rows?.[rowKey]?.icon ?? ""} onChange={(e) => handleContactRowChange(rowKey, "icon", e.target.value)} className="font-mono text-xs" />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <Label className="text-[10px] font-mono uppercase text-muted-foreground">{rowKey} · Label</Label>
                            <Input value={content.contact.rows?.[rowKey]?.label ?? ""} onChange={(e) => handleContactRowChange(rowKey, "label", e.target.value)} className="font-mono text-xs" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Online Channels</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Twitter / X</Label>
                          <Input value={content.contact.onlineChannels?.twitter ?? ""} onChange={(e) => handleContactOnlineChange("twitter", e.target.value)} className="font-mono text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Email</Label>
                          <Input value={content.contact.onlineChannels?.email ?? ""} onChange={(e) => handleContactOnlineChange("email", e.target.value)} className="font-mono text-xs" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Audience Tags</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Prospective Students</Label>
                          <Input value={content.contact.audienceTags?.prospectiveStudents ?? ""} onChange={(e) => handleContactAudienceChange("prospectiveStudents", e.target.value)} className="font-mono text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Visiting Researchers</Label>
                          <Input value={content.contact.audienceTags?.visitingResearchers ?? ""} onChange={(e) => handleContactAudienceChange("visitingResearchers", e.target.value)} className="font-mono text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Community Partners</Label>
                          <Input value={content.contact.audienceTags?.communityPartners ?? ""} onChange={(e) => handleContactAudienceChange("communityPartners", e.target.value)} className="font-mono text-xs" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}