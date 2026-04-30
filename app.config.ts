import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: "DentalBosch",
    slug: "dentalbosch",
    userInterfaceStyle: "automatic",
    plugins: [],
  };
};
