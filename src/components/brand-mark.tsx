import { cn, getAssetPath } from "@/lib/utils";
import { getContent } from "@/lib/content";

type BrandMarkProps = {
  className?: string;
  variant?: "color" | "reverse";
  logoSrc?: string;
  logoAlt?: string;
  showWordmarks?: boolean;
};

export function BrandMark({
  className,
  variant = "color",
  logoSrc = "/long_logo.webp",
  logoAlt,
  showWordmarks,
}: BrandMarkProps) {
  const { navbar } = getContent();
  const shouldShowWordmarks = showWordmarks ?? (navbar as any).showWordmarks ?? false;
  const src = logoSrc || "/long_logo.webp";
  const alt = logoAlt || navbar.brandLogoAlt || "Third Space Lab";

  return (
    <div
      className={
        "flex min-w-0 items-center gap-2 sm:gap-3 " + (className ?? "")
      }
    >
      <img
        src={getAssetPath(src)}
        alt={alt}
        width={180}
        height={56}
        className={cn(
          "w-auto object-contain shrink-0 transition-all",
          shouldShowWordmarks
            ? "h-7 sm:h-9"
            : "h-8 sm:h-11"
        )}
      />
      {shouldShowWordmarks && (
        <>
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
                "hidden text-xs font-normal sm:block " +
                (variant === "reverse"
                  ? "text-primary-foreground/75"
                  : "text-muted-foreground")
              }
            >
              {navbar.brandTagline}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
