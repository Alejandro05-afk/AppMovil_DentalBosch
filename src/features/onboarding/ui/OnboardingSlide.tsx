import React from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingSlide as SlideType } from '../model/onboarding.slides';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  slide: SlideType;
}

export function OnboardingSlide({ slide }: Props) {
  return (
    <View style={{ width: SCREEN_W, flex: 1 }} className="px-8">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 32, alignItems: 'center' }}>
          <View
            style={{
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: slide.iconBg,
              opacity: 0.45,
              top: -16,
              left: -16,
            }}
          />
          <View
            style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: slide.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={slide.icon as any} size={60} color={slide.iconColor} />
          </View>
        </View>

        <View className="items-center">
          <Text
            className="text-dark text-center font-bold mb-4"
            style={{ fontSize: 26, lineHeight: 32, letterSpacing: -0.5 }}
          >
            {slide.title}
          </Text>
          <Text
            className="text-center"
            style={{ fontSize: 15, lineHeight: 24, color: '#64748B', maxWidth: 300 }}
          >
            {slide.description}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
