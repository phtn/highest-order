"use client";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo } from "react";

export const useAppTheme = () => {
  const { setTheme: _setTheme, theme } = useTheme();

  const defaultTheme = useCallback(
    (event: MediaQueryListEvent) => {
      _setTheme(event.matches ? "dark" : "light");
    },
    [_setTheme],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    mediaQuery.addEventListener("change", defaultTheme);
    return () => mediaQuery.removeEventListener("change", defaultTheme);
  }, [defaultTheme]);

  const setTheme = useCallback(
    (_theme: "dark" | "light" | "system") => () => {
      _setTheme(_theme);
    },
    [_setTheme],
  );

  const toggleTheme = useCallback(() => {
    _setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, [_setTheme]);

  const isDark = useMemo(() => theme === "dark", [theme]);

  return [isDark, toggleTheme, theme, setTheme] as const;
};
