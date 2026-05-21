/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f8fafc",
          100: "#eef2f6",
          200: "#dbe4ed",
          500: "#64748b",
          700: "#334155",
          900: "#0f172a"
        },
        brand: {
          50: "#effdf9",
          100: "#d6f7ee",
          500: "#12b981",
          600: "#0f9f75",
          700: "#0a7559"
        },
        coral: {
          50: "#fff4ef",
          500: "#f9735b",
          600: "#df563f"
        }
      },
      boxShadow: {
        soft: "0 16px 42px rgba(15, 23, 42, 0.08)",
        lift: "0 20px 60px rgba(15, 23, 42, 0.12)"
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};
