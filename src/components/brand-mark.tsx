import { getAssetPath } from "@/lib/utils";
import contentData from "../../public/config/content.json";

type BrandMarkProps = {
  className?: string;
  variant?: "color" | "reverse";
};

/**
 * Brand mark for Thirdspace at UofT.
 *
 * Renders the official classic University of Toronto signature logo
 * (downloaded from utoronto.ca theme assets). Adjacent to it is a
 * "Thirdspace" wordmark with a "UofT" sub-tag.
 */
export function BrandMark({ className, variant = "color" }: BrandMarkProps) {
  const { navbar } = contentData;
  // Since the downloaded logo from UofT is the signature blue/red crest
  // with navy text, we use it directly. We use a standard HTML <img> tag
  // because Next.js <Image> optimization is not needed for SVGs and can trigger
  // layout shift warnings.
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
