"use client";

import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

import { api, ApiError, setToken, TokenResponse, UserProfile } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, tenantId: string, languagePref: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { setLocale } = useI18n();

  // FR-27: language preference is stored per account -- apply it whenever a
  // profile loads so it follows the student to a new device/browser,
  // overriding whatever (possibly stale/default) locale localStorage had.
  const applyUser = (profile: UserProfile) => {
    setUser(profile);
    if (profile.language_pref === "en" || profile.language_pref === "ms") {
      setLocale(profile.language_pref);
    }
  };

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("aasp_token") : null;
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<UserProfile>("/api/auth/me")
      .then(applyUser)
      .catch((err) => {
        // Only a genuine auth rejection should sign the user out -- a network
        // blip or backend 5xx must not silently destroy a valid session.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setToken(null);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applySession = (res: TokenResponse) => {
    setToken(res.access_token);
    applyUser(res.user);
  };

  const login = async (email: string, password: string) => {
    const res = await api.post<TokenResponse>("/api/auth/login", { email, password });
    applySession(res);
  };

  const register = async (email: string, password: string, tenantId: string, languagePref: string) => {
    const res = await api.post<TokenResponse>("/api/auth/register", {
      email,
      password,
      tenant_id: tenantId,
      language_pref: languagePref,
    });
    applySession(res);
  };

  const loginWithToken = async (token: string) => {
    setToken(token);
    const profile = await api.get<UserProfile>("/api/auth/me");
    applyUser(profile);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
