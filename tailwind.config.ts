import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: "",
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        panel: "#1A1D1F",
        accent: "#FF6B00",
        muted: "#6C7275",
      },
    },
  },
  plugins: [],
}

export default config 