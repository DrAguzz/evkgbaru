import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "tourist" | "rider" | "hub_manager" | "admin" | "super_admin";

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isRider: boolean;
  refreshRoles: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, meta: { name: string; phone?: string; nationality?: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const activeUserIdRef = useRef<string | null>(null);
  const rolesRequestRef = useRef(0);

  function syncSession(nextSession: Session | null) {
    const nextUser = nextSession?.user ?? null;
    setSession(nextSession);
    setUser(nextUser);
    activeUserIdRef.current = nextUser?.id ?? null;

    if (!nextUser) {
      rolesRequestRef.current += 1;
      setRoles([]);
    }
  }

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      syncSession(nextSession);
      if (nextSession?.user) {
        void loadRoles(nextSession.user.id);
      }
    });

    void supabase.auth.getSession()
      .then(({ data: { session: nextSession } }) => {
        if (!mounted) return;
        syncSession(nextSession);
        if (nextSession?.user) {
          void loadRoles(nextSession.user.id);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function loadRoles(uid: string) {
    const requestId = ++rolesRequestRef.current;
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);

    if (activeUserIdRef.current !== uid || requestId !== rolesRequestRef.current) return;

    if (error) {
      setRoles([]);
      return;
    }

    setRoles((data ?? []).map((r) => r.role as AppRole));
  }

  const value: AuthState = {
    user,
    session,
    roles,
    loading,
    isAdmin: roles.includes("admin") || roles.includes("super_admin"),
    isRider: roles.includes("rider"),
    async refreshRoles() {
      if (user) await loadRoles(user.id);
    },
    async signIn(email, password) {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };

        syncSession(data.session ?? null);
        if (data.session?.user) {
          await loadRoles(data.session.user.id);
        }

        return { error: null };
      } finally {
        setLoading(false);
      }
    },
    async signUp(email, password, meta) {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: meta,
          },
        });

        if (error) return { error: error.message };

        syncSession(data.session ?? null);
        if (data.session?.user) {
          await loadRoles(data.session.user.id);
        }

        return { error: null };
      } finally {
        setLoading(false);
      }
    },
    async signOut() {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        syncSession(null);
      } finally {
        setLoading(false);
      }
    },
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
