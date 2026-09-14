"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

const isThemePreference = (value: string | null): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system";

export function useTheme() {
  const [preference, setPreferenceState] =
    useState<ThemePreference>("system");

  const applyClass = useCallback((pref: ThemePreference) => {
    const isDark =
      pref === "dark" ||
      (pref === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const nextPreference = isThemePreference(stored) ? stored : "system";

    setPreferenceState(nextPreference);
    applyClass(nextPreference);
  }, [applyClass]);

  const setPreference = useCallback(
    (pref: ThemePreference) => {
      setPreferenceState(pref);

      if (pref === "system") {
        localStorage.removeItem("theme");
      } else {
        localStorage.setItem("theme", pref);
      }

      applyClass(pref);
    },
    [applyClass]
  );

  useEffect(() => {
    if (preference !== "system") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyClass("system");

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [preference, applyClass]);

  return { preference, setPreference };
}
