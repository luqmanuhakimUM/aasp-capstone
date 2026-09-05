"use client";

import { FormEvent, useState } from "react";

// TODO: replace with a real Formspree (or equivalent) form endpoint before launch.
// Create a form at https://formspree.io and paste its ID below.
const FORM_ENDPOINT = "https://formspree.io/f/REPLACE_WITH_FORM_ID";

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="rounded-2xl bg-(--surface) p-6 text-[15px]">
        Thanks — your message is on its way. We&apos;ll be in touch soon.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Name" name="name" required />
      <Field label="Email" name="email" type="email" required />
      <Field label="Institution / affiliation" name="institution" />
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-(--muted)">
          I am a…
        </label>
        <select
          name="role"
          defaultValue="student"
          className="w-full rounded-xl border border-(--border-subtle) bg-(--surface) px-4 py-3 text-[15px] outline-none focus:border-(--accent)"
        >
          <option value="student">Student</option>
          <option value="university-staff">University staff</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-(--muted)">
          Message
        </label>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full rounded-xl border border-(--border-subtle) bg-(--surface) px-4 py-3 text-[15px] outline-none focus:border-(--accent)"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex w-full items-center justify-center rounded-full bg-(--accent) px-6 py-3 text-[15px] font-medium text-(--accent-foreground) transition-transform active:scale-[0.97] disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Send"}
      </button>

      {status === "error" && (
        <p className="text-[13px] text-red-500">
          Something went wrong. Please email us directly at{" "}
          <a href="mailto:2204luqman@gmail.com" className="underline">
            2204luqman@gmail.com
          </a>
          .
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-(--muted)">
        {label}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        className="w-full rounded-xl border border-(--border-subtle) bg-(--surface) px-4 py-3 text-[15px] outline-none focus:border-(--accent)"
      />
    </div>
  );
}
