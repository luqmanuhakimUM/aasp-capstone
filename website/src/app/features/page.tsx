import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/Button";
import { FEATURES } from "@/lib/content";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Research Discovery, Academic Integrity Advisor, Writing Support Agent, and Source Organiser — the four tools inside AASP.",
};

export default function Features() {
  return (
    <>
      <section className="px-6 pb-16 pt-40 text-center">
        <Reveal>
          <h1 className="display max-w-3xl mx-auto">
            Everything a library and a writing tutor would give you.
          </h1>
          <p className="body-copy mx-auto mt-6 max-w-xl">
            Four tools, each scoped to support your work — never to replace
            your authorship.
          </p>
        </Reveal>
      </section>

      <div className="mx-auto max-w-4xl divide-y divide-(--border-subtle) px-6">
        {FEATURES.map((feature, i) => (
          <section
            key={feature.slug}
            id={feature.slug}
            className="scroll-mt-28 py-16"
          >
            <Reveal delay={i * 0.04}>
              <span className="text-[13px] font-medium text-(--accent)">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="headline mt-2">{feature.title}</h2>
              <p className="body-copy mt-4">{feature.detail}</p>
              <p className="mt-6 rounded-2xl bg-(--surface) p-5 text-[15px] italic text-(--muted)">
                {feature.example}
              </p>
            </Reveal>
          </section>
        ))}
      </div>

      <section className="px-6 py-24 text-center">
        <Reveal>
          <h2 className="headline">See it running at your university.</h2>
          <div className="mt-8">
            <Button href="/contact">Request a Pilot</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
