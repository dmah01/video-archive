"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light" | "system";

const THEME_KEY = "site-theme";

function getSystemTheme(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  const root = document.documentElement;

  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
}

export function ThemePicker({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);

    const initial: Theme =
      saved === "dark" || saved === "light" || saved === "system"
        ? saved
        : "system";

    setTheme(initial);
    applyTheme(initial);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (initial === "system") {
        applyTheme("system");
      }
    };

    media.addEventListener?.("change", handleSystemChange);

    return () => {
      media.removeEventListener?.("change", handleSystemChange);
    };
  }, []);

  const selectTheme = (next: Theme) => {
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  };

  return (
    <div
      className={`theme-picker ${compact ? "theme-picker-compact" : ""}`}
      aria-label="화면 모드 설정"
    >
      {([
        ["dark", "다크"],
        ["light", "화이트"],
        ["system", "시스템"],
      ] as const).map(([value, label]) => (
        <button
          key={value}
          type="button"
          className={theme === value ? "active" : ""}
          onClick={() => selectTheme(value)}
          aria-pressed={theme === value}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function ThemeSettings() {
  return <ThemePicker />;
}
