/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          start: "#C4E0A8",
          end: "#4ECDC4",
        },
        cta: "#3B82F6",
        bg: {
          light: "#F9FAFB",
        },
        text: {
          dark: "#111827",
          secondary: "#6B7280",
        },
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(to right, #C4E0A8, #4ECDC4)",
      },
    },
  },
  plugins: [],
};

