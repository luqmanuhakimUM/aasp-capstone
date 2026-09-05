"use client";

import { motion } from "motion/react";
import { ChangeEvent, useEffect, useState } from "react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { staggerContainer, staggerItem } from "@/components/ui/motionPresets";
import PageHeader from "@/components/ui/PageHeader";
import Switch from "@/components/ui/Switch";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface PolicyDocumentOut {
  id: string;
  title: string;
  doc_type: string;
  version: string;
  is_active: boolean;
  uploaded_at: string;
}

interface ChatGapOut {
  id: string;
  content: string;
  language: string;
  created_at: string;
}

export default function AdminPoliciesPage() {
  const { t } = useI18n();
  const [documents, setDocuments] = useState<PolicyDocumentOut[]>([]);
  const [gaps, setGaps] = useState<ChatGapOut[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    api.get<PolicyDocumentOut[]>("/api/admin/policies").then(setDocuments).catch(() => setDocuments([]));
    api.get<ChatGapOut[]>("/api/admin/chat-gaps").then(setGaps).catch(() => setGaps([]));
  };

  useEffect(refresh, []);

  const onUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      await api.upload("/api/admin/policies", file);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const toggleActive = async (doc: PolicyDocumentOut) => {
    await api.patch(`/api/admin/policies/${doc.id}`, { is_active: !doc.is_active });
    refresh();
  };

  return (
    <div>
      <PageHeader eyebrow={t("admin.eyebrow")} title={t("admin.title")} description={t("admin.description")} />

      <div className="mt-4">
        <label
          className={
            "inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 " +
            (uploading ? "cursor-not-allowed opacity-50" : "")
          }
        >
          {uploading && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          )}
          {uploading ? t("common.loading") : t("admin.upload")}
          <input type="file" accept=".pdf,.docx,.txt" onChange={onUpload} className="hidden" disabled={uploading} />
        </label>
        {error && <p className="mt-2 text-body text-danger-text">{error}</p>}
      </div>

      <section className="mt-6">
        <h2 className="text-eyebrow">{t("admin.documents")}</h2>
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mt-2 space-y-2">
          {documents.map((doc) => (
            <motion.div key={doc.id} variants={staggerItem}>
              <Card className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-body font-medium text-ink-primary">{doc.title}</p>
                  <p className="text-caption text-ink-tertiary">
                    {doc.doc_type} · v{doc.version}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={doc.is_active ? "success" : "neutral"}>
                    {doc.is_active ? t("admin.active") : t("admin.inactive")}
                  </Badge>
                  <Switch checked={doc.is_active} onChange={() => toggleActive(doc)} label={doc.title} />
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="mt-6">
        <h2 className="text-eyebrow">{t("admin.chatGaps")}</h2>
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mt-2 space-y-2">
          {gaps.map((gap) => (
            <motion.div key={gap.id} variants={staggerItem}>
              <Card tint="warning">
                <p className="text-body text-warning-text">{gap.content}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
