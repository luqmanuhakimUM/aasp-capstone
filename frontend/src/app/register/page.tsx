"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import AuthLayout from "@/components/AuthLayout";
import GoogleButton from "@/components/GoogleButton";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { ErrorText, Field, fieldControlClass } from "@/components/ui/Field";
import { api, ApiError, Tenant } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function RegisterPage() {
  const { register } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    api
      .get<Tenant[]>("/api/auth/tenants")
      .then((list) => {
        setTenants(list);
        if (list.length > 0) setTenantId(list[0].id);
      })
      .catch(() => setTenants([]));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, tenantId, locale);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}>
        <Card>
          <h1 className="text-title text-ink-primary">{t("register.title")}</h1>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <Field label={t("register.university")}>
              <select
                required
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className={fieldControlClass}
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("register.email")}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldControlClass}
              />
            </Field>
            <Field label={t("register.password")}>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldControlClass}
              />
            </Field>
            <label className="flex items-start gap-2 text-caption text-ink-secondary">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-line"
              />
              {t("register.consent")}
            </label>
            {error && <ErrorText>{error}</ErrorText>}
            <Button type="submit" loading={submitting} disabled={!tenantId || !consent} className="w-full">
              {t("register.submit")}
            </Button>
          </form>
          <GoogleButton tenantId={tenantId} disabled={!consent} />
        </Card>
      </motion.div>
      <p className="mt-4 text-center text-body text-ink-secondary">
        {t("register.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          {t("register.logIn")}
        </Link>
      </p>
    </AuthLayout>
  );
}
