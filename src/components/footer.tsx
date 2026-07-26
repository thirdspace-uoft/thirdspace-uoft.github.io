import Link from "next/link";
import { BrandMark } from "./brand-mark";
import { Mail, MapPin, ExternalLink, ArrowUpRight } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import contentData from "../../public/config/content.json";

export function Footer() {
  const { location, brand, researchLabs, campuses, socials } = contentData;

  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-12 md:gap-8">
          {/* Column 1: Brand (4 cols) */}
          <div className="space-y-6 md:col-span-4">
            <Link
              href="/"
              className="flex items-center"
              aria-label={`${brand.name} ${brand.tagline} home`}
            >
              <BrandMark />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {brand.footerDescription}
            </p>
            {/* Social / Email Links */}
            <div className="flex items-center gap-3">
              {socials.xUrl && (
                <a
                  href={socials.xUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary ring-1 ring-border"
                  aria-label="Twitter / X"
                >
                  {/* SVG for X (formerly Twitter) */}
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-4 w-4 fill-current"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}
              {socials.email && (
                <a
                  href={`mailto:${socials.email}`}
                  className="flex min-h-9 items-center gap-2 rounded-full bg-muted/60 px-3 text-sm text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary ring-1 ring-border"
                  aria-label={`Email ${socials.email}`}
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="break-all">{socials.email}</span>
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Affiliations / Research (3 cols) */}
          <div className="space-y-4 md:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-primary/80">
              {researchLabs.title}
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {researchLabs.items.map((item, index) => (
                <li key={index}>
                  {item.url ? (
                    <a
                      href={item.url}
                      target={item.isExternal ? "_blank" : undefined}
                      rel={item.isExternal ? "noreferrer" : undefined}
                      className="group flex items-center hover:text-primary transition-colors"
                    >
                      {item.name}
                      {item.isExternal && (
                        <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                      )}
                    </a>
                  ) : (
                    <span className="hover:text-foreground transition-colors">
                      {item.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Campuses (2 cols) */}
          <div className="space-y-4 md:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-primary/80">
              {campuses.title}
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {campuses.items.map((campus, index) => (
                <li key={index}>
                  <a
                    href={campus.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    {campus.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
 
           {/* Column 4: Location Info (3 cols) */}
           <div className="space-y-4 md:col-span-3">
             <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-primary/80">
               {location.locationHeading}
             </h3>
             
             {/* Interactive Location Tag with Hover Google Map */}
             <HoverCard openDelay={100} closeDelay={100}>
               <HoverCardTrigger asChild>
                 <a
                   href={`https://maps.google.com/?q=${location.mapsQuery}`}
                   target="_blank"
                   rel="noreferrer"
                   className="group block relative rounded-2xl border border-dashed border-border bg-muted/30 p-4 transition-all duration-300 hover:bg-card hover:shadow-sm hover:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/40 overflow-hidden"
                 >
                   <div className="absolute top-0 right-0 h-16 w-16 bg-accent/5 rounded-full blur-xl transition-all group-hover:bg-accent/10" />
                   
                   <div className="relative space-y-3.5">
                     <div className="flex items-center gap-2">
                       <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent-foreground transition-transform duration-300 group-hover:scale-110">
                         {/* Animated Location Pin / Radar */}
                         <span className="absolute inline-flex h-full w-full rounded-lg bg-accent/20 opacity-0 group-hover:animate-ping group-hover:opacity-100" />
                         <MapPin className="h-4.5 w-4.5 text-accent-foreground relative z-10" />
                       </div>
                       <div>
                         <div className="flex items-center gap-1.5">
                           <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                             {location.title}
                           </span>
                         </div>
                         <p className="text-xs text-muted-foreground font-mono mt-0.5">
                           {location.coordinates}
                         </p>
                       </div>
                     </div>
                     
                     <div className="text-sm text-muted-foreground leading-relaxed pt-1 border-t border-border/40">
                        <p className="font-semibold text-foreground text-xs uppercase tracking-wide">
                          {location.institution}
                        </p>
                        <p className="mt-0.5">{location.street}</p>
                        <p>{location.cityCountry}</p>
                      </div>
                   </div>
                 </a>
               </HoverCardTrigger>
               <HoverCardContent 
                 side="top" 
                 align="end" 
                 sideOffset={12} 
                 className="w-[280px] sm:w-[320px] p-0 overflow-hidden rounded-xl bg-card border border-border shadow-lg"
               >
                 <div className="relative h-[200px] w-full bg-muted">
                   <iframe
                     title={`${location.institution} Location Map`}
                     src={`https://maps.google.com/maps?q=${location.mapsQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                     width="100%"
                     height="100%"
                     style={{ border: 0 }}
                     allowFullScreen={false}
                     loading="lazy"
                     referrerPolicy="no-referrer-when-downgrade"
                     className="absolute inset-0 grayscale contrast-125 opacity-90 transition-opacity hover:opacity-100 duration-300"
                   />
                 </div>
                 <div className="p-3 bg-card border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                   <span>{location.street}, Toronto</span>
                   <span className="text-[10px] font-semibold text-primary uppercase">{location.footerMapLabel}</span>
                 </div>
               </HoverCardContent>
             </HoverCard>
           </div>
         </div>

        {/* Footer Bottom */}
        <div className="mt-12 border-t border-border/60 pt-6 flex flex-col items-center justify-between gap-4 sm:flex-row text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <p>© {new Date().getFullYear()} {brand.name} {brand.copyrightSuffix}</p>
            {brand.creditAuthorUrl && (
              <>
                <span aria-hidden className="h-3 w-px bg-border" />
                <p className="flex items-center gap-1.5">
                  {brand.creditLabel}
                  {brand.creditAuthorUrl && (
                    <a
                      href={brand.creditAuthorUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={brand.creditLinkAriaLabel}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary ring-1 ring-border"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="h-3.5 w-3.5 fill-current"
                      >
                        <path d="M12 .297C5.37.297 0 5.67 0 12.297c0 5.302 3.438 9.8 8.205 11.385.6.111.82-.26.82-.578 0-.286-.011-1.04-.017-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.755-1.333-1.755-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.236 1.84 1.236 1.07 1.835 2.81 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.93 0-1.31.467-2.382 1.235-3.222-.123-.303-.535-1.524.117-3.176 0 0 1.008-.323 3.3 1.23a11.5 11.5 0 0 1 3.003-.403c1.02.005 2.045.138 3.003.403 2.29-1.553 3.297-1.23 3.297-1.23.653 1.652.242 2.873.119 3.176.77.84 1.233 1.912 1.233 3.222 0 4.608-2.803 5.62-5.475 5.92.43.37.815 1.103.815 2.222 0 1.606-.015 2.902-.015 3.293 0 .322.218.696.825.578C20.565 22.092 24 17.598 24 12.297 24 5.67 18.627.297 12 .297z" />
                      </svg>
                    </a>
                  )}
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-6">
            <a
              href={socials.xUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:underline hover:text-primary flex items-center gap-1"
            >
              {socials.xHandle} <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-[10px] uppercase tracking-[0.18em] text-primary/70 font-semibold">
              {brand.tagline}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
