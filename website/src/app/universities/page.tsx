import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/Button";

export const metadata: Metadata = {
  title: "For Universities",
  description:
    "What onboarding a university to AASP involves: data isolation, policy documents, and compliance.",
};

const POINTS = [
  {
    title: "Your data stays yours",
    detail:
      "AASP is multi-tenant by design: every student search, chat, draft, and reference list is scoped to your institution and isolated at the database level. No cross-tenant access, under any account — enforced by row-level security, not just application logic.",
  },
  {
    title: "Grounded in your own policies",
    detail:
      "You upload your AI-use policy, MQA-aligned integrity guidelines, and your NAGI framework documents. The Integrity Advisor answers student questions only from that material — never generic web knowledge — and cites the source section in every answer.",
  },
  {
    title: "Visibility into what students are being told",
    detail:
      "A policy-admin dashboard shows any question the Advisor couldn't confidently answer, so you can see gaps in your own documentation before a student is left guessing.",
  },
  {
    title: "Built with compliance in mind",
    detail:
      "Designed with Malaysia's Personal Data Protection Act (PDPA) in mind: explicit consent at account creation, data minimization, and a documented deletion path for account closure.",
  },
];

export default function Universities() {
  return (
    <>
      <section className="px-6 pb-16 pt-40 text-center">
        <Reveal>
          <h1 className="display max-w-3xl mx-auto">
            A pilot your students can use on day one.
          </h1>
          <p className="body-copy mx-auto mt-6 max-w-xl">
            Onboarding is document upload, not integration work.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="grid gap-12 sm:grid-cols-2">
          {POINTS.map((point, i) => (
            <Reveal key={point.title} delay={i * 0.05}>
              <h2 className="text-[19px] font-semibold">{point.title}</h2>
              <p className="body-copy mt-2 text-[15px]">{point.detail}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-(--border-subtle) bg-(--surface) px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="headline">What we need from you to start</h2>
            <ol className="body-copy mt-6 list-decimal space-y-3 pl-5 text-[15px]">
              <li>Your institution&apos;s AI-use policy document.</li>
              <li>
                MQA-aligned academic integrity guidelines and your NAGI
                framework document (or the national default, if you don&apos;t
                have an institution-specific one).
              </li>
              <li>A contact for a policy-admin account.</li>
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="px-6 py-24 text-center">
        <Reveal>
          <h2 className="headline">Ready to start a pilot conversation?</h2>
          <div className="mt-8">
            <Button href="/contact">Request a Pilot</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
