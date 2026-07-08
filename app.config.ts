import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: "DentalBosch",
    slug: "dentalbosch",
    owner: "alejoafk_05",
    scheme: "dentalbosch",
    userInterfaceStyle: "automatic",
    extra: {
      eas: {
        "projectId": "49cfe676-a695-40fc-9f19-d07c583a5183",
      },
    },
    icon: "./assets/images/logo.png",
    notification: {
      icon: "./assets/images/notification-icon.png",
      color: "#FF4FA3",
    },
    plugins: [
      "@react-native-community/datetimepicker",
      "expo-font",
      "expo-router",
    ],
    android: {
      package: 'com.dentalbosch',
      icon: "./assets/images/logo.png",
      googleServicesFile: "./google-services.json",
    },
  };
};
