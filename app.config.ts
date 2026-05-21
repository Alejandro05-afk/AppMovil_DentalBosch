import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: "DentalBosch",
    slug: "dentalbosch",
    scheme: "dentalbosch",
    userInterfaceStyle: "automatic",
    plugins: [],
  };
};
