import { getAssetPath } from "@/lib/utils";
import { getContent } from "@/lib/content";

type BrandMarkProps = {
  className?: string;
  variant?: "color" | "reverse";
};

export function BrandMark({ className, variant = "color" }: BrandMarkProps) {
  const { navbar } = getContent();
  return (
    <div
      className={
        "flex items-center gap-3 " + (className ?? "")
      }
    >
      <img
        src={getAssetPath("/uoft-logo.svg")}
        alt={navbar.brandLogoAlt}
        width={150}
        height={40}
        className="h-10 w-auto object-contain shrink-0"
      />
      <span
        aria-hidden
        className="h-8 w-px bg-border"
      />
      <div className="flex flex-col leading-tight">
        <span
          className={
            "text-base font-semibold tracking-tight " +
            (variant === "reverse" ? "text-primary-foreground" : "text-primary")
          }
        >
          {navbar.brandName}
        </span>
        <span
          className={
            "text-[10px] font-medium uppercase tracking-[0.18em] " +
            (variant === "reverse"
              ? "text-primary-foreground/70"
              : "text-muted-foreground")
          }
        >
          {navbar.brandTagline}
        </span>
      </div>
    </div>
  );
}
