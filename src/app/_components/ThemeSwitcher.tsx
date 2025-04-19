// src/app/_components/ThemeSwitcher.tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid"; // Ou seus ícones preferidos

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Garante que o componente só renderize no cliente após a montagem
  // para evitar mismatch de hidratação com o tema padrão/localStorage
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Renderiza um placeholder ou nada no servidor/antes da montagem
    // Ajuste o tamanho para corresponder ao botão final para evitar CLS
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
