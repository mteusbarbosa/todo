import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/_components/**/*.{js,ts,jsx,tsx,mdx}", // Se você tiver uma pasta components
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",     // Para o App Router
    ],
    darkMode: "class",
    theme: {
        extend: {},
    },
    plugins: [],
};

export default config;