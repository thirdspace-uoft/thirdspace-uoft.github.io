"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export type SectionInfo = {
  id: string;
  label: string;
};

export function useSectionObserver() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sections, setSections] = useState<SectionInfo[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setActiveSection(null);
    setScrollProgress(0);
    setSections([]);

    let observer: IntersectionObserver | null = null;
    let scrollHandler: (() => void) | null = null;

    const raf = requestAnimationFrame(() => {
      const els = document.querySelectorAll<HTMLElement>("[data-section]");
      const list: SectionInfo[] = [];

      els.forEach((el) => {
        const id = el.getAttribute("data-section")!;
        const label = el.getAttribute("data-section-label") || id;
        list.push({ id, label });
      });

      setSections(list);
      if (list.length === 0) return;

      const ratioMap = new Map<string, number>();

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const id = entry.target.getAttribute("data-section")!;
            ratioMap.set(id, entry.intersectionRatio);
          });

          let maxRatio = 0;
          let maxId: string | null = null;
          ratioMap.forEach((ratio, id) => {
            if (ratio > maxRatio) {
              maxRatio = ratio;
              maxId = id;
            }
          });

          if (maxId) setActiveSection(maxId);
        },
        {
          threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
          rootMargin: "-80px 0px -30% 0px",
        }
      );

      els.forEach((el) => observer!.observe(el));

      scrollHandler = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(docHeight > 0 ? scrollTop / docHeight : 0);
      };

      scrollHandler();
      window.addEventListener("scroll", scrollHandler, { passive: true });
    });

    return () => {
      cancelAnimationFrame(raf);
      if (observer) observer.disconnect();
      if (scrollHandler) window.removeEventListener("scroll", scrollHandler);
    };
  }, [pathname]);

  const scrollTo = useCallback((id: string) => {
    const el = document.querySelector<HTMLElement>(`[data-section="${id}"]`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  return { activeSection, sections, scrollTo, scrollProgress };
}
