import Link from "next/link";
import { BrandMark } from "./brand-mark";
import { XIcon } from "./x-icon";
import { Mail } from "lucide-react";
import { getContent } from "@/lib/content";

const { location, brand, socials } = getContent();

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          {/* Brand & Description */}
          <div className="max-w-md space-y-3">
            <Link
              href="/"
              className="inline-flex items-center"
              aria-label={`${brand.name} ${brand.tagline} home`}
            >
              <BrandMark showWordmarks={true} />
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {brand.footerDescription}
            </p>
          </div>

          {/* Contact & Location */}
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-12 md:gap-16 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Location</h4>
              <p className="leading-snug">{location.institution}</p>
              <p className="leading-snug">{location.street}</p>
              <p className="leading-snug">{location.cityCountry}</p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Connect</h4>
              <ul className="space-y-1.5">
                {socials.email && (
                  <li>
                    <a
                      href={`mailto:${socials.email}`}
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
                    >
                      <Mail className="size-4" />
                      <span>{socials.email}</span>
                    </a>
                  </li>
                )}
                {socials.xUrl && (
                  <li>
                    <a
                      href={socials.xUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
                    >
                      <XIcon className="size-3.5" />
                      <span>{socials.xHandle || "Twitter"}</span>
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-10 border-t border-border pt-6 flex flex-col items-center justify-between gap-3 sm:flex-row text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {brand.name}. {brand.copyrightSuffix}
          </p>
          <span className="text-xs text-muted-foreground/80 font-normal">
            {brand.tagline}
          </span>
        </div>
      </div>
    </footer>
  );
}
