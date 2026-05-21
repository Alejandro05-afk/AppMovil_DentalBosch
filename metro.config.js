const { getDefaultConfig } = require("expo/metro-config");
const { withTamagui } = require("@tamagui/metro-plugin");
const { withNativeWind } = require("nativewind/metro");

let config = getDefaultConfig(__dirname, { isCSSEnabled: true });

config = withTamagui(config, {
  components: ["tamagui"],
  config: "./tamagui.config.ts",
});

module.exports = withNativeWind(config, { input: "./global.css" });
