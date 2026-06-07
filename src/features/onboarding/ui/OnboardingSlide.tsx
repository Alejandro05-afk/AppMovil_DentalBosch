import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingSlide as SlideType } from '../model/onboarding.slides';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  slide: SlideType;
  isActive: boolean;
}

export function OnboardingSlide({ slide, isActive }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const scaleIcon = useRef(new Animated.Value(0.72)).current;

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(scaleIcon, {
          toValue: 1,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      translateY.setValue(24);
      scaleIcon.setValue(0.72);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  return (
    <View style={{ width: SCREEN_W }} className="flex-1 items-center justify-center px-8">
      <Animated.View
        style={{ transform: [{ scale: scaleIcon }], opacity: fadeAnim, marginBottom: 44 }}
      >
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
      </Animated.View>

      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY }] }}
        className="items-center"
      >
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
      </Animated.View>
    </View>
  );
}