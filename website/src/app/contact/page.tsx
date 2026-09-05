import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";

export const metadata = {
  title: "Contact",
  description: "Request a pilot or get in touch with the AASP team.",
};

export default function Contact() {
  return (
    <section className="mx-auto max-w-xl px-6 pb-24 pt-40">
      <Reveal>
        <h1 className="display text-4xl sm:text-5xl">
          Let&apos;s talk about a pilot.
        </h1>
        <p className="body-copy mt-4">
          Tell us a bit about you or your institution — we&apos;ll get back
          to you by email.
        </p>
        <p className="mt-2 text-[13px] text-(--muted)">
          You can also reach us directly at{" "}
          <a href="mailto:2204luqman@gmail.com" className="text-(--accent) hover:underline">
            2204luqman@gmail.com
          </a>
          .
        </p>
      </Reveal>
      <Reveal delay={0.05} className="mt-10">
        <ContactForm />
      </Reveal>
    </section>
  );
}
