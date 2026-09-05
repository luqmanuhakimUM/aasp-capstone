"use client";

import { motion } from "motion/react";
import { Building2, Move, X } from "lucide-react";
import { ChangeEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { staggerContainer, staggerItem } from "@/components/ui/motionPresets";
import PageHeader from "@/components/ui/PageHeader";
import Switch from "@/components/ui/Switch";
import { api, ApiError, assetUrl } from "@/lib/api";
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
  const { user, refreshUser } = useAuth();
  const [documents, setDocuments] = useState<PolicyDocumentOut[]>([]);
  const [gaps, setGaps] = useState<ChatGapOut[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoScale, setLogoScale] = useState(100);
  const [resizing, setResizing] = useState(false);
  const [logoAspectRatio, setLogoAspectRatio] = useState(1);
  const resizeBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.tenant_logo_scale != null) setLogoScale(user.tenant_logo_scale);
  }, [user?.tenant_logo_scale]);

  const persistLogoScale = async (value: number) => {
    try {
      await api.patch("/api/admin/logo/scale", { scale: value });
    } catch (err) {
      setLogoError(err instanceof ApiError ? err.message : t("common.error"));
    }
  };

  const onResizePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = resizeBoxRef.current;
    if (!container) return;
    setResizing(true);

    let latest = logoScale;
    const onMove = (moveEvent: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const fracX = Math.abs(moveEvent.clientX - centerX) / (rect.width / 2);
      const fracY = Math.abs(moveEvent.clientY - centerY) / (rect.height / 2);
      latest = Math.min(100, Math.max(20, Math.round(Math.max(fracX, fracY) * 100)));
      setLogoScale(latest);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setResizing(false);
      persistLogoScale(latest);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const onUploadLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    setUploadingLogo(true);
    try {
      await api.upload("/api/admin/logo", file);
      await refreshUser();
    } catch (err) {
      setLogoError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const onRemoveLogo = async () => {
    setLogoError(null);
    setRemovingLogo(true);
    try {
      await api.delete("/api/admin/logo");
      await refreshUser();
    } catch (err) {
      setLogoError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setRemovingLogo(false);
    }
  };

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

      <Card className="mt-4">
        <h2 className="text-eyebrow">{t("admin.logoTitle")}</h2>
        <p className="mt-1 text-caption text-ink-secondary">{t("admin.logoDescription")}</p>
        <div className="mt-3 flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-white">
            {user?.tenant_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetUrl(user.tenant_logo_url)} alt={user.tenant_name} className="h-full w-full object-contain p-1" />
            ) : (
              <Building2 className="h-6 w-6 text-ink-tertiary" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label
              className={
                "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface-elevated px-4 py-2 text-sm font-medium text-ink-primary hover:border-line-strong " +
                (uploadingLogo ? "cursor-not-allowed opacity-50" : "")
              }
            >
              {uploadingLogo && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
              )}
              {uploadingLogo ? t("common.loading") : t("admin.logoUpload")}
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={onUploadLogo}
                className="hidden"
                disabled={uploadingLogo}
              />
            </label>
            {user?.tenant_logo_url && (
              <button
                type="button"
                onClick={onRemoveLogo}
                disabled={removingLogo}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-tertiary hover:bg-danger-bg hover:text-danger-text disabled:cursor-not-allowed disabled:opacity-50"
              >
                {removingLogo ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
                {t("admin.logoRemove")}
              </button>
            )}
          </div>
        </div>
        {logoError && <p className="mt-2 text-body text-danger-text">{logoError}</p>}

        {user?.tenant_logo_url && (
          <div className="mt-4">
            <p className="mb-2 text-caption text-ink-tertiary">{t("admin.logoResizeHint")}</p>
            <div
              ref={resizeBoxRef}
              className="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl px-8 py-6"
              style={{ background: "var(--dashboard-hero-bg)" }}
            >
              <div
                className="relative h-full max-w-full"
                style={{ aspectRatio: logoAspectRatio, transform: `scale(${logoScale / 100})` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={assetUrl(user.tenant_logo_url)}
                  alt={user.tenant_name}
                  className="h-full w-full object-contain"
                  onLoad={(e) => {
                    const { naturalWidth, naturalHeight } = e.currentTarget;
                    if (naturalWidth && naturalHeight) setLogoAspectRatio(naturalWidth / naturalHeight);
                  }}
                />
                {/* Deliberately smaller than a 44px touch target -- a precision
                    drag-resize grip (like Figma/PowerPoint corner handles),
                    not a primary tap action; this page is desktop-oriented. */}
                <div
                  onPointerDown={onResizePointerDown}
                  className="absolute -bottom-2 -right-2 grid h-7 w-7 cursor-nwse-resize touch-none place-items-center rounded-full border-2 border-white bg-brand-500 text-white shadow-lift transition-transform"
                  style={{ transform: `scale(${(100 / logoScale) * (resizing ? 1.1 : 1)})` }}
                  role="slider"
                  aria-label={t("admin.logoResizeHandle")}
                  aria-valuemin={20}
                  aria-valuemax={100}
                  aria-valuenow={logoScale}
                >
                  <Move className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
            <p className="mt-2 text-center text-caption text-ink-tertiary">{logoScale}%</p>
          </div>
        )}
      </Card>

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
