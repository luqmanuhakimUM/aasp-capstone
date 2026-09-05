"use client";

import { motion } from "motion/react";
import { Building2, Plus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { fieldControlClass, Label } from "@/components/ui/Field";
import { scrollReveal } from "@/components/ui/motionPresets";
import PageHeader from "@/components/ui/PageHeader";
import { api, ApiError, Tenant } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function SuperAdminTenantsPage() {
  const { t } = useI18n();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [name, setName] = useState("");
  const [localeDefault, setLocaleDefault] = useState("en");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const refresh = () => {
    api.get<Tenant[]>("/api/super-admin/tenants").then(setTenants).catch(() => setTenants([]));
  };

  useEffect(refresh, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await api.post<Tenant>("/api/super-admin/tenants", {
        name,
        locale_default: localeDefault,
        admin_email: adminEmail,
        admin_password: adminPassword,
      });
      setName("");
      setAdminEmail("");
      setAdminPassword("");
      setSuccess(true);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader eyebrow={t("superAdmin.eyebrow")} title={t("superAdmin.title")} description={t("superAdmin.description")} />

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="h-fit">
          <div className="flex items-center gap-2 text-sm font-bold text-ink-primary">
            <Building2 className="h-4 w-4 text-brand-500" />
            {t("superAdmin.submit")}
          </div>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <div>
              <Label>{t("superAdmin.nameLabel")}</Label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={fieldControlClass}
              />
            </div>
            <div>
              <Label>{t("superAdmin.localeLabel")}</Label>
              <select value={localeDefault} onChange={(e) => setLocaleDefault(e.target.value)} className={fieldControlClass}>
                <option value="en">English</option>
                <option value="ms">Bahasa Malaysia</option>
              </select>
            </div>
            <div>
              <Label>{t("superAdmin.adminEmailLabel")}</Label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                className={fieldControlClass}
              />
            </div>
            <div>
              <Label>{t("superAdmin.adminPasswordLabel")}</Label>
              <input
                type="password"
                minLength={8}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                className={fieldControlClass}
              />
            </div>
            <Button type="submit" loading={submitting} className="w-full">
              {!submitting && <Plus className="h-4 w-4" />}
              {t("superAdmin.submit")}
            </Button>
          </form>
          {error && <p className="mt-3 text-caption text-danger-text">{error}</p>}
          {success && <p className="mt-3 text-caption text-success-text">{t("superAdmin.created")}</p>}
        </Card>

        <Card className="min-h-[420px]">
          <h2 className="text-title text-ink-primary">{t("superAdmin.existing")}</h2>
          {tenants.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-neutral-text text-white">
                <Building2 className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-title text-ink-primary">{t("superAdmin.emptyTitle")}</h3>
              <p className="mt-2 max-w-sm text-body text-ink-secondary">{t("superAdmin.empty")}</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {tenants.map((tenant) => (
                <motion.div
                  key={tenant.id}
                  {...scrollReveal}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line p-3"
                >
                  <span className="text-body font-medium text-ink-primary">{tenant.name}</span>
                  <Badge>{tenant.locale_default.toUpperCase()}</Badge>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
