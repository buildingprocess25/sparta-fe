"use client";

import { useEffect, useRef } from "react";
import { useGlobalAlert } from "@/context/GlobalAlertContext";
import { setApiErrorHandler } from "@/lib/api";

type NormalizedError = {
  message: string;
  details?: string;
  key: string;
};

const isDev = process.env.NODE_ENV !== "production";

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const normalizeError = (error: unknown, source?: string) : NormalizedError => {
  if (error instanceof Error) {
    const details = isDev ? [source, error.stack].filter(Boolean).join("\n") : undefined;
    return {
      message: error.message || "Terjadi kesalahan.",
      details,
      key: `${error.name}:${error.message}:${source || ""}`,
    };
  }

  const message = typeof error === "string" ? error : "Terjadi kesalahan.";
  const details = isDev ? [source, safeStringify(error)].filter(Boolean).join("\n") : undefined;

  return {
    message,
    details,
    key: `${message}:${source || ""}`,
  };
};

export default function ErrorReporter() {
  const { showAlert } = useGlobalAlert();
  const lastErrorRef = useRef<{ key: string; at: number } | null>(null);

  useEffect(() => {
    const shouldSkip = (key: string) => {
      const now = Date.now();
      if (!lastErrorRef.current) return false;
      const { key: lastKey, at } = lastErrorRef.current;
      return lastKey === key && now - at < 2000;
    };

    const record = (key: string) => {
      lastErrorRef.current = { key, at: Date.now() };
    };

    const handleError = (event: ErrorEvent) => {
      const location = event.filename
        ? `Source: ${event.filename}:${event.lineno}:${event.colno}`
        : undefined;
      const normalized = normalizeError(event.error || event.message, location);
      if (shouldSkip(normalized.key)) return;
      record(normalized.key);

      showAlert({
        title: "Error",
        message: isDev ? normalized.message : "Terjadi kesalahan. Silakan coba lagi.",
        type: "error",
        details: isDev ? normalized.details : undefined,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const normalized = normalizeError(event.reason, "Unhandled Promise Rejection");
      if (shouldSkip(normalized.key)) return;
      record(normalized.key);

      showAlert({
        title: "Error",
        message: isDev ? normalized.message : "Terjadi kesalahan. Silakan coba lagi.",
        type: "error",
        details: isDev ? normalized.details : undefined,
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    setApiErrorHandler((error, context) => {
      const details = isDev
        ? [context?.url ? `URL: ${context.url}` : null, error.stack].filter(Boolean).join("\n")
        : undefined;

      showAlert({
        title: "Error",
        message: isDev ? error.message : "Terjadi kesalahan. Silakan coba lagi.",
        type: "error",
        details,
      });
    });

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
      setApiErrorHandler(null);
    };
  }, [showAlert]);

  return null;
}
