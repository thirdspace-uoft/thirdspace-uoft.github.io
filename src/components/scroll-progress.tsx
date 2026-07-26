"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { NavigationItem } from "@/components/navigation-item";
import { useSectionContext } from "@/components/section-observer";
import { cn } from "@/lib/utils";

const DOT_CENTER = 13;

export function ScrollProgress() {
  const { activeSection, sections, scrollTo, scrollProgress } = useSectionContext();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const activeIndex = useMemo(
    () => (activeSection ? sections.findIndex((s) => s.id === activeSection) : -1),
    [activeSection, sections]
  );

  if (sections.length === 0) return null;

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

      {/* Mobile progress indicator */}
      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 md:hidden">
        <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 backdrop-blur-sm">
          {sections.map(({ id }, index) => {
            const isActive = id === activeSection;
            const isCompleted = activeIndex >= 0 && index < activeIndex;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                aria-label={`Scroll to ${id}`}
                className="flex items-center justify-center"
                type="button"
              >
                <motion.div
                  className={cn(
                    "rounded-full transition-colors",
                    isActive && "bg-primary",
                    isCompleted && "bg-primary/60",
                    !isActive && !isCompleted && "bg-border"
                  )}
                  animate={{
                    width: isActive ? 8 : 5,
                    height: isActive ? 8 : 5,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
