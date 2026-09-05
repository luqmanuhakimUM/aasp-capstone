"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import AuthLayout from "@/components/AuthLayout";
import GoogleButton from "@/components/GoogleButton";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { ErrorText, Field, fieldControlClass } from "@/components/ui/Field";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("login.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}>
        <Card>
          <h1 className="text-title text-ink-primary">{t("login.title")}</h1>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <Field label={t("login.email")}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldControlClass}
              />
            </Field>
            <Field label={t("login.password")}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldControlClass}
              />
            </Field>
            {error && <ErrorText>{error}</ErrorText>}
            <Button type="submit" loading={submitting} className="w-full">
              {t("login.submit")}
            </Button>
          </form>
          <GoogleButton />
        </Card>
      </motion.div>
      <p className="mt-4 text-center text-body text-ink-secondary">
        {t("login.noAccount")}{" "}
        <Link href="/register" className="font-medium text-brand-700 hover:underline">
          {t("login.createOne")}
        </Link>
      </p>
    </AuthLayout>
  );
}
