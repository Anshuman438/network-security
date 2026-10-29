/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "#0b0c10",
          raised: "rgba(22, 24, 32, 0.65)",
          inset: "rgba(14, 16, 22, 0.65)",
          border: "rgba(255, 255, 255, 0.08)",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(168, 85, 247, 0.2), 0 18px 50px rgba(0, 0, 0, 0.4)",
        "clay-card": "inset 1px 1px 2px rgba(255, 255, 255, 0.12), inset -2px -2px 6px rgba(0, 0, 0, 0.6), 0 16px 36px -6px rgba(0, 0, 0, 0.5)",
        "clay-pill": "inset 1px 1px 2px rgba(255, 255, 255, 0.22), inset -1px -1px 3px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)",
        "clay-btn": "inset 1px 1px 2px rgba(255, 255, 255, 0.3), inset -2px -2px 4px rgba(0, 0, 0, 0.5), 0 8px 18px -2px rgba(0, 0, 0, 0.4)",
        "glass-edge": "0 0 0 1px rgba(255, 255, 255, 0.1), 0 10px 30px 0 rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};
