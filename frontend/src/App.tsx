import { useEffect, useState } from "react";

import { type AuthUser, ensureCsrf, fetchMe, logout } from "./api/auth";
import { Landing } from "./Landing";
import { Login } from "./Login";
import { TreeScreen } from "./TreeScreen";

type Page = "landing" | "tree";
type AuthState = "checking" | "anon" | "authed";

export default function App() {
  const [auth, setAuth] = useState<AuthState>("checking");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [page, setPage] = useState<Page>("landing");

  useEffect(() => {
    let active = true;
    ensureCsrf().finally(() => {
      fetchMe()
        .then((u) => {
          if (!active) return;
          setUser(u);
          setAuth("authed");
        })
        .catch(() => active && setAuth("anon"));
    });
    return () => {
      active = false;
    };
  }, []);

  if (auth === "checking") {
    return <div className="auth-splash">Loading…</div>;
  }
  if (auth === "anon") {
    return (
      <Login
        onSuccess={(u) => {
          setUser(u);
          setAuth("authed");
        }}
      />
    );
  }

  const onLogout = async () => {
    await logout();
    setUser(null);
    setPage("landing");
    setAuth("anon");
  };

  if (page === "tree") {
    return <TreeScreen onHome={() => setPage("landing")} onLogout={onLogout} />;
  }
  return <Landing onEnter={() => setPage("tree")} onLogout={onLogout} userName={user?.name} />;
}
