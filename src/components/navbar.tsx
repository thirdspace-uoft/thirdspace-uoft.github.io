"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import contentData from "../../public/config/content.json";

type NavLink = { label: string; href: string };

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

/**
 * Editorial desktop nav: a small mono numeral precedes each label. On hover
 * or when active the numeral picks up the brand colour and a hairline
 * slides under the label. Spacing is deliberately generous so the row
 * reads like a journal masthead, not a SaaS pill bar.
 */
function DesktopLinks({ links, pathname }: { links: NavLink[]; pathname: string }) {
  return (
    <nav
      aria-label="Primary"
      className="hidden items-center gap-1 md:flex"
    >
      {links.map((link, i) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.label}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className="group relative inline-flex items-baseline gap-2 px-3 py-2"
          >
            <span
              className={cn(
                "font-mono text-[10px] uppercase tracking-[0.18em] transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground/60 group-hover:text-primary",
              )}
              aria-hidden
            >
              {pad2(i + 1)}
            </span>
            <span
              className={cn(
                "relative text-sm transition-colors",
                active
                  ? "text-foreground"
                  : "text-foreground/70 group-hover:text-foreground",
              )}
            >
              {link.label}
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -bottom-0.5 left-0 h-px bg-primary transition-[width] duration-300 ease-out",
                  active
                    ? "w-full"
                    : "w-0 group-hover:w-full",
                )}
              />
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Two-bar hamburger that morphs into an X when the sheet is open. The
 * lines are heavier than a default `Menu` icon and carry a label below
 * that swaps between "Menu" and "Close" so the affordance stays legible.
 */
function MenuToggle({
  open,
  onClick,
  brandName,
  menuOpenLabel,
  menuCloseLabel,
}: {
  open: boolean;
  onClick: () => void;
  brandName: string;
  menuOpenLabel: string;
  menuCloseLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? `Close ${brandName} menu` : `Open ${brandName} menu`}
      aria-expanded={open}
      className="group inline-flex flex-col items-center justify-center gap-1.5 px-2 py-2 md:hidden"
    >
      <span
        aria-hidden
        className="relative block h-3.5 w-6"
      >
        <span
          className={cn(
            "absolute left-0 right-0 top-0 h-[2px] origin-center bg-foreground transition-transform duration-300 ease-out",
            open && "translate-y-[7px] rotate-45",
          )}
        />
        <span
          className={cn(
            "absolute left-0 right-0 bottom-0 h-[2px] origin-center bg-foreground transition-transform duration-300 ease-out",
            open && "-translate-y-[7px] -rotate-45",
          )}
        />
      </span>
      <span
        aria-hidden
        className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground transition-colors group-hover:text-foreground"
      >
        {open ? menuCloseLabel : menuOpenLabel}
      </span>
    </button>
  );
}

/**
 * Mobile drawer: full-width sheet with editorial link list. Each link
 * carries the same numeric prefix used on desktop and is separated by a
 * single hairline rule — no boxes, no cards.
 */
function MobileLinks({
  links,
  pathname,
  onNavigate,
  brandName,
  mobileDrawerUniversity,
  mobileFooterLine,
}: {
  links: NavLink[];
  pathname: string;
  onNavigate: () => void;
  brandName: string;
  mobileDrawerUniversity: string;
  mobileFooterLine: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b border-border px-6 py-5">
        <SheetTitle className="font-heading text-base font-medium text-foreground">
          {brandName}
        </SheetTitle>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {mobileDrawerUniversity}
        </p>
      </SheetHeader>
      <nav
        aria-label="Primary"
        className="flex-1 overflow-y-auto px-2"
      >
        <ul className="divide-y divide-border">
          {links.map((link, i) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.label}>
                <SheetClose asChild>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className="group flex items-baseline gap-4 px-4 py-4"
                  >
                    <span
                      className={cn(
                        "font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
                        active
                          ? "text-primary"
                          : "text-muted-foreground/60 group-hover:text-primary",
                      )}
                      aria-hidden
                    >
                      {pad2(i + 1)}
                    </span>
                    <span
                      className={cn(
                        "flex-1 text-lg transition-colors",
                        active
                          ? "font-medium text-foreground"
                          : "text-foreground/80 group-hover:text-foreground",
                      )}
                    >
                      {link.label}
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "font-mono text-[10px] uppercase tracking-[0.22em] transition-opacity",
                        active ? "text-primary opacity-100" : "opacity-0 group-hover:opacity-100",
                      )}
                    >
                      ↗
                    </span>
                  </Link>
                </SheetClose>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border px-6 py-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {mobileFooterLine}
        </p>
      </div>
    </div>
  );
}

export function Navbar() {
  const { navbar, layout } = contentData;
  const links = (navbar.links ?? []) as NavLink[];
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label={`${navbar.brandName} ${layout.homeAriaLabelSuffix}`}
        >
          <BrandMark />
        </Link>

        <DesktopLinks links={links} pathname={pathname} />

        <Sheet open={open} onOpenChange={setOpen}>
          <MenuToggle
            open={open}
            onClick={() => setOpen((o) => !o)}
            brandName={navbar.brandName}
            menuOpenLabel={navbar.menuOpenLabel}
            menuCloseLabel={navbar.menuCloseLabel}
          />
          <SheetContent
            side="right"
            className="w-full max-w-sm gap-0 border-l border-border p-0 sm:max-w-sm"
            showCloseButton={false}
          >
            <MobileLinks
              links={links}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
              brandName={navbar.brandName}
              mobileDrawerUniversity={navbar.mobileDrawerUniversity}
              mobileFooterLine={navbar.mobileFooterLine}
            />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
