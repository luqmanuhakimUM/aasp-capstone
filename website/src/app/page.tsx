import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/Button";
import { FEATURES, PROBLEM_STATS } from "@/lib/content";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="flex min-h-[92vh] flex-col items-center justify-center px-6 text-center">
        <Reveal>
          <p className="mb-4 text-[15px] font-medium text-(--accent)">
            AASP · AI Academic Success Platform
          </p>
          <h1 className="display max-w-4xl">
            The library and writing tutor every student deserves.
          </h1>
          <p className="body-copy mx-auto mt-6 max-w-2xl">
            Research, citation, and academic-integrity guidance for B40
            students at rural and distance-learning universities — grounded
            in your own institution&apos;s policies, in English or Bahasa
            Malaysia, on any Android phone.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button href="/contact">Request a Pilot</Button>
            <Button href="/features" variant="secondary">
              See how it works →
            </Button>
          </div>
        </Reveal>
      </section>

      {/* Problem */}
      <section className="border-t border-(--border-subtle) bg-(--surface) px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="headline max-w-2xl">
              For too many students, there&apos;s no one to ask.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {PROBLEM_STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.08}>
                <h3 className="text-[19px] font-semibold">{stat.label}</h3>
                <p className="body-copy mt-2 text-[15px]">{stat.detail}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features preview */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="headline max-w-2xl">
              Four tools. One goal: find 5 credible sources and know your
              work is your own — in under 20 minutes.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.slug} delay={i * 0.06}>
                <Link
                  href={`/features#${feature.slug}`}
                  className="block h-full rounded-3xl border border-(--border-subtle) bg-(--surface) p-8 transition-transform hover:-translate-y-1"
                >
                  <h3 className="text-[21px] font-semibold">
                    {feature.title}
                  </h3>
                  <p className="body-copy mt-3 text-[15px]">{feature.short}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t border-(--border-subtle) bg-(--surface) px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="headline max-w-2xl">Built for two audiences.</h2>
          </Reveal>
          <div className="mt-14 grid gap-10 sm:grid-cols-2">
            <Reveal>
              <h3 className="text-[19px] font-semibold">Students</h3>
              <p className="body-copy mt-2 text-[15px]">
                A fast, low-data companion for research, citation, and
                knowing where the line is — without needing to travel to
                campus or wait for a human.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h3 className="text-[19px] font-semibold">Universities</h3>
              <p className="body-copy mt-2 text-[15px]">
                A multi-tenant platform your students can use on day one,
                grounded in the policy documents you upload — with full data
                isolation from every other institution on the platform.
              </p>
              <Link
                href="/universities"
                className="mt-3 inline-block text-[15px] font-medium text-(--accent) hover:underline"
              >
                Learn what pilots involve →
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-6 py-28 text-center">
        <Reveal>
          <h2 className="headline">Ready to bring AASP to your students?</h2>
          <p className="body-copy mx-auto mt-4 max-w-xl">
            Tell us about your institution and we&apos;ll get back to you
            about starting a pilot.
          </p>
          <div className="mt-8">
            <Button href="/contact">Request a Pilot</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
