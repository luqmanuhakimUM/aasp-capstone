import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why AASP exists, who it's built for, and the design approach behind it.",
};

export default function About() {
  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-40">
      <Reveal>
        <h1 className="display">Why AASP exists.</h1>
        <div className="body-copy mt-8 space-y-6 text-[17px]">
          <p>
            B40 students at rural and distance-learning Malaysian
            universities face a structural gap: no physical library, no
            walk-in writing centre, and often no one to ask &ldquo;is this
            allowed?&rdquo; before submitting work. Existing tools solve
            pieces of this — Google Scholar for search, Grammarly for
            grammar — but none of them are grounded in a student&apos;s own
            institution&apos;s policy, usable in Bahasa Malaysia, or designed
            for the connectivity and device constraints this group actually
            has.
          </p>
          <p>
            AASP consolidates research discovery, integrity guidance, writing
            feedback, and source organization into one low-bandwidth
            platform — deliberately scoped to support a student&apos;s own
            work, not replace it. The Writing Support Agent never rewrites a
            paragraph on a student&apos;s behalf; the Integrity Advisor never
            guesses at a policy it isn&apos;t grounded in. Those aren&apos;t
            missing features — they&apos;re the point.
          </p>
          <p>
            This site and the product it describes are built with the same
            standard: restraint over decoration, fast over flashy, and every
            claim traceable back to something real — a source, a policy
            document, or a stated assumption.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
