import React from 'react';
import { TamaguiProvider, Theme } from 'tamagui';

import { tamaguiConfig } from './tamagui.config';

interface TamaguiAppProviderProps {
  children: React.ReactNode;
}

export function TamaguiAppProvider({ children }: TamaguiAppProviderProps) {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="dentalLight">
      <Theme name="dentalLight">{children}</Theme>
    </TamaguiProvider>
  );
}
