// Configuration Babel pour Expo + NativeWind (Tailwind pour React Native).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // `jsxImportSource: nativewind` permet d'utiliser la prop `className`.
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      // Le preset NativeWind ajoute déjà `react-native-reanimated/plugin`
      // (via react-native-css-interop), inutile de le répéter ici.
      "nativewind/babel",
    ],
  };
};
