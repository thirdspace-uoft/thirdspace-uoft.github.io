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
import { getContent } from "@/lib/content";

type NavLink = { label: string; href: string };

const { navbar, layout } = getContent();

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DesktopLinks({ links, pathname }: { links: NavLink[]; pathname: string }) {
  return (
    <nav
      aria-label="Primary"
      className="hidden items-center gap-1 md:flex"
    >
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.label}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className="group relative inline-flex items-baseline px-3 py-2"
          >
            <span
              className={cn(
                "relative type-body transition-colors",
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

function MenuToggle({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? `Close ${navbar.brandName} menu` : `Open ${navbar.brandName} menu`}
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
        {open ? navbar.menuCloseLabel : navbar.menuOpenLabel}
      </span>
    </button>
  );
}

function MobileLinks({
  links,
  pathname,
  onNavigate,
}: {
  links: NavLink[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b border-border px-6 py-5">
        <SheetTitle className="type-body font-medium text-foreground">
          {navbar.brandName}
        </SheetTitle>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {navbar.mobileDrawerUniversity}
        </p>
      </SheetHeader>
      <nav
        aria-label="Primary"
        className="flex-1 overflow-y-auto px-2"
      >
        <ul className="divide-y divide-border">
          {links.map((link) => {
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
                        "flex-1 type-body font-medium transition-colors",
                        active
                          ? "text-foreground"
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
          {navbar.mobileFooterLine}
        </p>
      </div>
    </div>
  );
}

export function Navbar() {
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
            />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
