"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import {
  Sheet,
  SheetClose,
  SheetContent,
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
      className="hidden items-center gap-6 lg:gap-8 md:flex"
    >
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.label}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              active
                ? "text-primary font-semibold"
                : "text-foreground/70",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileDrawer({
  links,
  pathname,
  onClose,
}: {
  links: NavLink[];
  pathname: string;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-background p-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <SheetTitle className="text-base font-semibold text-foreground">
          {navbar.brandName}
        </SheetTitle>
        <SheetClose asChild>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </SheetClose>
      </div>

      <nav aria-label="Mobile Navigation" className="flex-1 py-6">
        <ul className="flex flex-col gap-4">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.label}>
                <SheetClose asChild>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onClose}
                    className={cn(
                      "block text-base font-medium transition-colors py-1.5",
                      active
                        ? "text-primary font-semibold"
                        : "text-foreground/75 hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function Navbar() {
  const links = (navbar.links ?? []) as NavLink[];
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center"
          aria-label={`${navbar.brandName} ${layout.homeAriaLabelSuffix}`}
        >
          <BrandMark
            className="min-w-0"
            logoSrc="/long_logo.webp"
            showWordmarks={(navbar as any).showWordmarks ?? false}
          />
        </Link>

        <DesktopLinks links={links} pathname={pathname} />

        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={open}
            className="inline-flex size-9 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <Menu className="size-5" />
          </button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent
              side="right"
              className="w-[280px] max-w-[80vw] gap-0 border-l border-border p-0 sm:max-w-xs"
              showCloseButton={false}
            >
              <MobileDrawer
                links={links}
                pathname={pathname}
                onClose={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

