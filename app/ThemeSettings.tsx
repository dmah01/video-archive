"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

const THEME_KEY = "site-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
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
    const onChange = () => {
      if (initial === "system") applyTheme("system");
    };

    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  function selectTheme(next: Theme) {
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }

  return (
    <div
      className="theme-settings"
      style={{ position: "fixed", top: "12px", right: "12px", zIndex: 2147483647 }}
      aria-label="화면 모드 설정"
    >
      {(["dark", "light", "system"] as Theme[]).map((value) => {
        const active = theme === value;
        const label =
          value === "dark" ? "다크" : value === "light" ? "화이트" : "시스템";

        return (
          <button
            key={value}
            type="button"
            onClick={() => selectTheme(value)}
            aria-pressed={active}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
