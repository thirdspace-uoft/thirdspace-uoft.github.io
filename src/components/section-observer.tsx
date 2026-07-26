"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSectionObserver, type SectionInfo } from "@/hooks/use-section-observer";

type SectionContextType = {
  activeSection: string | null;
  sections: SectionInfo[];
  scrollTo: (id: string) => void;
  scrollProgress: number;
};

const SectionContext = createContext<SectionContextType | null>(null);

export function SectionObserver({ children }: { children: ReactNode }) {
  const observer = useSectionObserver();

  return (
    <SectionContext.Provider value={observer}>
      {children}
    </SectionContext.Provider>
  );
}

export function useSectionContext(): SectionContextType {
  const ctx = useContext(SectionContext);
  if (!ctx) {
    throw new Error("useSectionContext must be used within a <SectionObserver />");
  }
  return ctx;
}
