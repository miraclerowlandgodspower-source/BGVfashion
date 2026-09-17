"use client";

import React from "react";
import { useStore } from "@/context/StoreContext";

export function Toast() {
  const { toast } = useStore();

  if (!toast.visible || !toast.message) return null;

  return (
    <div id="toast-container" role="status" aria-live="polite">
      {toast.message}
    </div>
  );
}
