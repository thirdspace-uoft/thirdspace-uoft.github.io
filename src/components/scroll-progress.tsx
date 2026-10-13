"use client";

import { useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { NavigationItem } from "@/components/navigation-item";
import { useSectionContext } from "@/components/section-observer";
import { getContent } from "@/lib/content";
import { cn } from "@/lib/utils";

const DOT_CENTER = 13;

export function ScrollProgress() {
  const pathname = usePathname() ?? "/";
  const { navbar } = getContent();
  const { activeSection, sections, scrollTo, scrollProgress } = useSectionContext();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isEnabled = useMemo(() => {
    if (pathname === "/") {
      return (navbar as any).showSideMenuHome ?? false;
    }
    if (pathname.startsWith("/people")) {
      return (navbar as any).showSideMenuPeople ?? false;
    }
    if (pathname.startsWith("/publications")) {
      return (navbar as any).showSideMenuPublications ?? true;
    }
    return false;
  }, [pathname, navbar]);

  const activeIndex = useMemo(
    () => (activeSection ? sections.findIndex((s) => s.id === activeSection) : -1),
    [activeSection, sections]
  );

  if (!isEnabled || sections.length === 0) return null;

  const ITEM_GAP = 36;
  const lineTop = DOT_CENTER + 4;
  const lineHeight = sections.length * ITEM_GAP - DOT_CENTER - 8;

  return (
    <>
      {/* Desktop side navigation */}
      <nav
        aria-label="Section navigation"
        className={cn(
          "fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 select-none md:block"
        )}
      >
        <div className="relative flex flex-col items-start">
          {/* Vertical track line */}
          <div
            className="absolute w-px bg-border/30"
            style={{
              left: DOT_CENTER - 0.5,
              top: lineTop,
              height: lineHeight,
            }}
          />

          {/* Filled line — follows continuous scroll progress */}
          <motion.div
            className="absolute w-px bg-primary/60 origin-top"
            style={{ left: DOT_CENTER - 0.5, top: lineTop }}
            animate={{ height: scrollProgress * lineHeight }}
            transition={{ duration: 0.2, ease: "linear" }}
          />

          {sections.map(({ id, label }, index) => {
            const isActive = id === activeSection;
            const isCompleted = activeIndex >= 0 && index < activeIndex;
            const distance = activeIndex >= 0 ? Math.abs(index - activeIndex) : Infinity;

            return (
              <div
                key={id}
                className="relative flex items-center"
                style={{ height: ITEM_GAP }}
              >
                <NavigationItem
                  label={label}
                  isActive={isActive}
                  isCompleted={isCompleted}
                  distance={distance}
                  onClick={() => scrollTo(id)}
                />
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
}
