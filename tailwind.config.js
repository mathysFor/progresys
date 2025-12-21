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
          start: "#F955D5",
          end: "#506199",
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
        "gradient-primary": "linear-gradient(to right, #F955D5, #506199)",
      },
    },
  },
  plugins: [],
};

