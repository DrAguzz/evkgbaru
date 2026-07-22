import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "customer"
  | "tourist" // legacy alias for customer
  | "rider"
  | "hub_admin"
  | "hub_manager" // legacy alias for hub_admin
  | "admin" // legacy alias for super_admin
  | "super_admin";

export interface UserRoleRow {
  role: AppRole;
  hub_id: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  roleRows: UserRoleRow[];
  loading: boolean;
  isCustomer: boolean;
  isRider: boolean;
  isHubAdmin: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean; // super_admin or hub_admin (dashboard access)
  hubIds: string[]; // hubs this user is a hub_admin of
  refreshRoles: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    meta: { name: string; phone?: string; nationality?: string },
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roleRows, setRoleRows] = useState<UserRoleRow[]>([]);
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
      setRoleRows([]);
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

    void supabase.auth
      .getSession()
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
    const { data, error } = await supabase
      .from("user_roles")
      .select("role, hub_id")
      .eq("user_id", uid);

    if (activeUserIdRef.current !== uid || requestId !== rolesRequestRef.current) return;

    if (error) {
      setRoleRows([]);
      return;
    }

    setRoleRows(
      (data ?? []).map((r) => ({
        role: r.role as AppRole,
        hub_id: (r as { hub_id: string | null }).hub_id ?? null,
      })),
    );
  }

  const roles = roleRows.map((r) => r.role);
  const isSuperAdmin = roles.includes("super_admin") || roles.includes("admin");
  const isHubAdmin = roles.includes("hub_admin") || roles.includes("hub_manager");
  const hubIds = roleRows
    .filter((r) => r.role === "hub_admin" || r.role === "hub_manager")
    .map((r) => r.hub_id)
    .filter((x): x is string => !!x);

  const value: AuthState = {
    user,
    session,
    roles,
    roleRows,
    loading,
    isCustomer: roles.includes("customer") || roles.includes("tourist"),
    isRider: roles.includes("rider"),
    isHubAdmin,
    isSuperAdmin,
    isAdmin: isSuperAdmin || isHubAdmin,
    hubIds,
    async refreshRoles() {
      if (user) await loadRoles(user.id);
    },
    async signIn(email, password) {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        syncSession(data.session ?? null);
        if (data.session?.user) await loadRoles(data.session.user.id);
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
        if (data.session?.user) await loadRoles(data.session.user.id);
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
