module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "expo-router/babel",
      ["@tamagui/babel-plugin", {
        components: ["tamagui"],
        config: "./tamagui.config.ts",
      }],
      "react-native-reanimated/plugin",
    ],
  };
};
