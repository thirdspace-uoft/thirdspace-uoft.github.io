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
        "flex min-w-0 items-center gap-2 sm:gap-3 " + (className ?? "")
      }
    >
      <img
        src={getAssetPath("/uoft-logo.svg")}
        alt={navbar.brandLogoAlt}
        width={150}
        height={40}
        className="h-8 w-auto object-contain shrink-0 sm:h-10"
      />
      <span
        aria-hidden
        className="hidden h-8 w-px bg-border sm:block"
      />
      <div className="flex min-w-0 flex-col leading-tight">
        <span
          className={
            "truncate text-base font-semibold tracking-tight " +
            (variant === "reverse" ? "text-primary-foreground" : "text-primary")
          }
        >
          {navbar.brandName}
        </span>
        <span
          className={
            "hidden text-[12px] font-medium uppercase tracking-[0.18em] sm:block " +
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
