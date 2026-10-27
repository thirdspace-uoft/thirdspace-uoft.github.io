import {
  CodeXml,
  Database,
  FileText,
  Globe,
  Image as ImageIcon,
  Link as LinkIcon,
  MonitorPlay,
  Newspaper,
  Presentation,
  Video,
  type LucideIcon,
} from "lucide-react";

import type { ResourceKind } from "@/lib/blog";

/** Display name, group heading and icon for each kind, in the order groups are shown. */
export const KIND_META: Record<ResourceKind, { label: string; group: string; icon: LucideIcon }> = {
  paper: { label: "Paper", group: "Papers", icon: FileText },
  code: { label: "Code", group: "Code", icon: CodeXml },
  project: { label: "Project", group: "Project pages", icon: Globe },
  demo: { label: "Demo", group: "Demos", icon: MonitorPlay },
  video: { label: "Video", group: "Videos", icon: Video },
  dataset: { label: "Data", group: "Data", icon: Database },
  slides: { label: "Slides", group: "Slides", icon: Presentation },
  poster: { label: "Poster", group: "Posters", icon: ImageIcon },
  press: { label: "Press", group: "In the press", icon: Newspaper },
  link: { label: "Link", group: "Links", icon: LinkIcon },
};

export const KIND_ORDER = Object.keys(KIND_META) as ResourceKind[];
