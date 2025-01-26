import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    extend: {
      colors: {
        background: "black",
        card: "#1E1E1E",
        primary: "#F59E0B",
      },
    },
  },
  plugins: [],
}

export default config 