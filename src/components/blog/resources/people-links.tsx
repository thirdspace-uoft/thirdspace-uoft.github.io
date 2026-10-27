import Link from "next/link";
import { Fragment } from "react";

import { resolvePerson } from "@/lib/blog";

/**
 * Names joined with commas; lab members are bold and link to their People
 * row, everyone else is plain text. Used for paper authors and video speakers.
 */
export function PeopleLinks({ names }: { names: string[] }) {
  return (
    <>
      {names.map((name, i) => {
        const person = resolvePerson(name);
        return (
          <Fragment key={`${name}-${i}`}>
            {i > 0 && ", "}
            {person.isMember && person.href ? (
              <Link href={person.href} className="font-semibold text-foreground hover:text-primary hover:underline">
                {name}
              </Link>
            ) : (
              name
            )}
          </Fragment>
        );
      })}
    </>
  );
}
