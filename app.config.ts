import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: "DentalBosch",
    slug: "dentalbosch",
    scheme: "dentalbosch",
    userInterfaceStyle: "automatic",
    extra: {
      eas: {
        "projectId": "49cfe676-a695-40fc-9f19-d07c583a5183",
      },
    },
    icon: "./assets/images/logo.png",
    plugins: [
      ["@react-native-google-signin/google-signin", {
        iosUrlScheme: "com.googleusercontent.apps.108646556094-ukhtgll2jcq4l3jnmrf1kh2s9c22pb8i",
      }],
    ],
    android: {
      package: 'com.dentalbosch',
      icon: "./assets/images/logo.png",
    },
  };
};
