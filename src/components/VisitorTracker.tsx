"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    let sessionId = window.localStorage.getItem("bgv_visitor_session");
    if (!sessionId) {
      sessionId = `${crypto.randomUUID()}-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem("bgv_visitor_session", sessionId);
    }
    void fetch("/api/analytics/visitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, currentPage: pathname || "/" }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}