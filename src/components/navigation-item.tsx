"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItemProps = {
  label: string;
  isActive: boolean;
  isCompleted: boolean;
  distance: number;
  onClick: () => void;
};

function getScale(distance: number, isActive: boolean, isCompleted: boolean): number {
  if (isActive) return 1;
  if (isCompleted) return 0.85;
  if (distance === 1) return 0.7;
  return 0.5;
}

function getIndicatorSize(isActive: boolean, isCompleted: boolean, distance: number): number {
  if (isActive) return 22;
  if (isCompleted) return 16;
  if (distance === 1) return 12;
  return 9;
}

export function NavigationItem({
  label,
  isActive,
  isCompleted,
  distance,
  onClick,
}: NavItemProps) {
  const dotSize = getIndicatorSize(isActive, isCompleted, distance);
  const dotScale = getScale(distance, isActive, isCompleted);

  return (
    <button
      onClick={onClick}
      className="group relative flex items-center gap-3 outline-none"
      aria-label={`Scroll to ${label}`}
      type="button"
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: 26, height: 26 }}
      >
        <motion.div
          className={cn(
            "flex items-center justify-center transition-colors duration-300",
            isCompleted && "bg-primary",
            !isCompleted && !isActive && "border",
            !isCompleted && !isActive && distance <= 1
              ? "border-muted-foreground/40"
              : "border-muted-foreground/20",
            isActive && "bg-primary"
          )}
          animate={{
            width: dotSize,
            height: dotSize,
            scale: dotScale,
            borderRadius: isActive ? 5 : 9999,
            rotate: isActive ? 45 : 0,
          }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
        >
          {isCompleted && (
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{ rotate: isCompleted ? 0 : 0 }}
            >
              <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
            </motion.span>
          )}
        </motion.div>
      </div>

      <motion.span
        className={cn(
          "origin-left whitespace-nowrap font-mono text-[12px] uppercase tracking-[0.18em] transition-colors duration-300",
          isActive ? "text-foreground" : "text-muted-foreground",
          !isActive && "group-hover:text-foreground/80"
        )}
        animate={{
          opacity: isActive ? 1 : isCompleted ? 0.55 : distance <= 1 ? 0.45 : 0.15,
          scale: isActive ? 1 : 0.88,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {label}
      </motion.span>
    </button>
  );
}
