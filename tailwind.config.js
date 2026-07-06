/** @type {import('tailwindcss').Config} */
// Thème noir & blanc strict. Les seules couleurs "vives" servent uniquement
// à l'indicateur de marge du calculateur (vert / orange / rouge).
module.exports = {
  // "class" (plutôt que le "media" par défaut) : requis par NativeWind sur
  // le web pour pouvoir fixer explicitement le mode clair (app.json ->
  // userInterfaceStyle), sinon react-native-css-interop lève une erreur.
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#1C1C1E", // texte principal
        muted: "#8E8E93", // texte secondaire
        line: "#E5E5EA", // bordures / séparateurs
        surface: "#F2F2F7", // fonds légers
        success: "#34C759", // marge > 50%
        warning: "#FF9500", // marge 30-50%
        danger: "#FF3B30", // marge < 30% / suppression
      },
    },
  },
  plugins: [],
};
