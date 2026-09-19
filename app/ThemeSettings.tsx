"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

const THEME_KEY = "site-theme";

function getSystemTheme(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  const root = document.documentElement;

  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
}

export default function ThemeSettings() {
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
    <div className="theme-settings" aria-label="화면 모드 설정">
      <button
        type="button"
        className={theme === "dark" ? "active" : ""}
        onClick={() => selectTheme("dark")}
        aria-pressed={theme === "dark"}
      >
        다크
      </button>

      <button
        type="button"
        className={theme === "light" ? "active" : ""}
        onClick={() => selectTheme("light")}
        aria-pressed={theme === "light"}
      >
        화이트
      </button>

      <button
        type="button"
        className={theme === "system" ? "active" : ""}
        onClick={() => selectTheme("system")}
        aria-pressed={theme === "system"}
      >
        시스템
      </button>
    </div>
  );
}
