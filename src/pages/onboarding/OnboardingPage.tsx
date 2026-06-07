import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingPager, PATIENT_SLIDES, DOCTOR_SLIDES } from '@/features/onboarding';
import { onboardingStorage } from '@/shared/lib/onboardingStorage';

export function OnboardingPage() {
  const { userId, rol } = useLocalSearchParams<{ userId: string; rol: string }>();

  const slides = rol === 'doctor' ? DOCTOR_SLIDES : PATIENT_SLIDES;

  const handleFinish = async () => {
    if (userId) {
      await onboardingStorage.markCompleted(userId);
    }
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <OnboardingPager slides={slides} onFinish={handleFinish} />
    </SafeAreaView>
  );
}