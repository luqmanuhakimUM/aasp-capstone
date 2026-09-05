"use client";

import { AnimatePresence, motion } from "motion/react";
import { MessageSquarePlus, Send, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface CitedChunk {
  document_title: string;
  page_number: number;
  excerpt: string;
}

interface ChatMessageOut {
  role: string;
  content: string;
  cited_policy_chunks: CitedChunk[];
  confidence: string;
  language: string;
}

interface ChatResponse {
  session_id: string;
  message: ChatMessageOut;
}

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  cited?: CitedChunk[];
  confidence?: string;
}

interface ChatSessionOut {
  id: string;
  started_at: string;
  preview: string;
}

const CONFIDENCE_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  high: "success",
  medium: "warning",
  low: "danger",
};

const SAMPLE_PROMPTS: Record<"en" | "ms", string[]> = {
  en: ["Can I use ChatGPT to paraphrase?", "What must I disclose?", "Is grammar checking allowed?"],
  ms: ["Bolehkah saya guna ChatGPT untuk parafrasa?", "Apa yang perlu saya dedahkan?", "Adakah semakan tatabahasa dibenarkan?"],
};

export default function IntegrityPage() {
  const { t, locale } = useI18n();
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [sessions, setSessions] = useState<ChatSessionOut[]>([]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = () => {
    api
      .get<ChatSessionOut[]>("/api/integrity/sessions")
      .then(setSessions)
      .catch(() => setSessions([]));
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const openSession = async (id: string) => {
    setError(null);
    setSessionId(id);
    try {
      const history = await api.get<ChatMessageOut[]>(`/api/integrity/chat/${id}`);
      setMessages(
        history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          cited: m.cited_policy_chunks,
          confidence: m.confidence,
        }))
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    }
  };

  const newChat = () => {
    setSessionId(undefined);
    setMessages([]);
    setError(null);
  };

  const ask = async (value: string) => {
    if (!value.trim()) return;
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: value }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post<ChatResponse>("/api/integrity/chat", {
        message: value,
        session_id: sessionId,
      });
      setSessionId(res.session_id);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.message.content,
          cited: res.message.cited_policy_chunks,
          confidence: res.message.confidence,
        },
      ]);
      loadSessions();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow={t("integrity.eyebrow")}
        title={t("integrity.title")}
        description={t("integrity.description")}
        disclaimer={t("integrity.disclaimer")}
      />

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.7fr_2fr]">
        <Card className="h-fit">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-ink-primary">{t("integrity.history")}</span>
            <button
              onClick={newChat}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-caption font-semibold text-brand-700 hover:bg-brand-tint"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              {t("integrity.newChat")}
            </button>
          </div>
          <div className="mt-3 space-y-1.5">
            {sessions.length === 0 && <p className="text-caption text-ink-tertiary">{t("integrity.noHistory")}</p>}
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => openSession(s.id)}
                className={
                  "block w-full rounded-lg px-2.5 py-2 text-left text-caption transition-colors " +
                  (s.id === sessionId ? "bg-brand-tint text-brand-700" : "text-ink-secondary hover:bg-surface-sunken")
                }
              >
                <span className="block truncate font-medium">{s.preview || t("integrity.newChat")}</span>
                <span className="block text-[11px] text-ink-tertiary">
                  {new Date(s.started_at).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <div className="flex flex-col">
          <div className="space-y-3">
        {messages.length === 0 && !loading && (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface-sunken p-6 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber text-amber-ink">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-title text-ink-primary">{t("integrity.emptyTitle")}</h3>
            <p className="mt-1.5 max-w-xs text-caption text-ink-secondary">{t("integrity.empty")}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SAMPLE_PROMPTS[locale].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => ask(prompt)}
                  className="rounded-lg border border-line bg-surface-elevated px-3 py-2 text-left text-[11px] font-semibold text-ink-secondary hover:border-brand-200 hover:bg-brand-tint"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: m.role === "user" ? 24 : -24, y: 8 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ type: "spring", bounce: 0.1, duration: 0.35 }}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-body " +
                  (m.role === "user"
                    ? "rounded-br-sm bg-brand-500 text-white"
                    : "material-card rounded-bl-sm border border-line")
                }
              >
                <p>{m.content}</p>
                {m.confidence && (
                  <div className="mt-2">
                    <Badge tone={CONFIDENCE_TONE[m.confidence] ?? "neutral"}>
                      {t(`integrity.confidence.${m.confidence}`) || m.confidence}
                    </Badge>
                  </div>
                )}
                {m.cited && m.cited.length > 0 && (
                  <div className="mt-2 space-y-1.5 border-t border-line pt-2">
                    {m.cited.map((c, j) => (
                      <details key={j} className="text-xs">
                        <summary className="cursor-pointer rounded-full bg-neutral-bg px-2.5 py-0.5 font-medium text-neutral-text">
                          {c.document_title} · p.{c.page_number}
                        </summary>
                        <p className="mt-1 rounded-lg border border-line bg-surface-sunken px-2.5 py-1.5 text-caption text-ink-secondary">
                          {c.excerpt}
                        </p>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="material-card flex items-center gap-1 rounded-2xl rounded-bl-sm border border-line px-3.5 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-ink-tertiary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}
            {error && <p className="text-caption text-danger-text">{error}</p>}
          </div>

          <form onSubmit={onSubmit} className="material-chrome sticky bottom-0 mt-4 flex gap-2 rounded-xl border border-line p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("integrity.placeholder")}
              className="w-full rounded-lg bg-transparent px-3 py-2 text-body text-ink-primary placeholder:text-ink-tertiary outline-none"
            />
            <Button type="submit" loading={loading}>
              <Send className="h-4 w-4" />
              {t("integrity.send")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
