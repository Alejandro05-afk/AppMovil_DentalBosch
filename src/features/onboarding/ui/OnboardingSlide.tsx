import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingSlide as SlideType } from '../model/onboarding.slides';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  slide: SlideType;
}

export function OnboardingSlide({ slide }: Props) {
  return (
    <View style={{ width: SCREEN_W, flex: 1, alignItems: 'center', justifyContent: 'center' }} className="px-8">
      <View style={{ marginBottom: 44, alignItems: 'center' }}>
        <View
          style={{
            position: 'absolute',
            width: 188,
            height: 188,
            borderRadius: 94,
            backgroundColor: slide.iconBg,
            opacity: 0.45,
            top: -20,
            left: -20,
          }}
        />
        <View
          style={{
            width: 148,
            height: 148,
            borderRadius: 74,
            backgroundColor: slide.iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={slide.icon as any} size={64} color={slide.iconColor} />
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
    </View>
  );
}