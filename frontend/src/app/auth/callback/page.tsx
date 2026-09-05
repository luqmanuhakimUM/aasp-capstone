"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import Card from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";

function GoogleCallbackContent() {
  const { loginWithToken } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      loginWithToken(token)
        .then(() => router.replace("/dashboard"))
        .catch(() => setError("google_failed"));
      return;
    }
    setError(params.get("error") || "google_failed");
    // Only run once on mount -- loginWithToken/router are stable, params won't change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    const noAccount = error === "google_no_account";
    return (
      <div className="mx-auto max-w-sm">
        <Card>
          <h1 className="text-title text-ink-primary">{t("login.title")}</h1>
          <p className="mt-3 text-body text-danger-text">{t(`auth.errors.${error}`)}</p>
          <Link
            href={noAccount ? "/register" : "/login"}
            className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600"
          >
            {t(noAccount ? "register.title" : "login.title")}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      <p className="text-caption text-ink-secondary">{t("auth.signingIn")}</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
