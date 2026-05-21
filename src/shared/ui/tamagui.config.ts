import { defaultConfig } from '@tamagui/config/v4';
import { createTamagui } from 'tamagui';

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    dentalLight: {
      ...defaultConfig.themes.light,
      background: '#F8FAFC',
      backgroundHover: '#F1F5F9',
      color: '#0F172A',
      colorFocus: '#FF4FA3',
      borderColor: '#E2E8F0',
      primary: '#FF4FA3',
      secondary: '#38D6C4',
      accent: '#7CF3E6',
      muted: '#64748B',
      surface: '#FFFFFF',
    },
  },
});

export default tamaguiConfig;

export type DentalTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends DentalTamaguiConfig {}
}
