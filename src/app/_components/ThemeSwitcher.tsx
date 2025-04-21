"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-8 w-8" aria-hidden="true"></div>;
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Mudar para tema ${theme === "light" ? "escuro" : "claro"}`}
      title={`Mudar para tema ${theme === "light" ? "escuro" : "claro"}`}
      className="rounded-full p-2 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none "
    >
      {theme === "light" ? (
        <MoonIcon className="h-6 w-6 text-gray-700" />
      ) : (
        <SunIcon className="h-6 w-6 text-yellow-500" />
      )}
    </button>
  );
}
