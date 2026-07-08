import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { OnboardingSlide } from './OnboardingSlide';
import { OnboardingSlide as SlideType } from '../model/onboarding.slides';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  slides: SlideType[];
  onFinish: () => void;
}

export function OnboardingPager({ slides, onFinish }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const isLast = currentIndex === slides.length - 1;
  const activeSlide = slides[currentIndex];

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
      setCurrentIndex(index);
    },
    []
  );

  const goNext = () => {
    if (isLast) { onFinish(); return; }
    scrollRef.current?.scrollTo({ x: (currentIndex + 1) * SCREEN_W, animated: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ paddingTop: 12, paddingBottom: 4 }}>
        <Text style={{ fontSize: 22, color: '#FF4FA3', fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' }}>
          DentalBosch
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onMomentumScrollEnd={handleMomentumEnd}
          style={{ flex: 1 }}
        >
          {slides.map((item) => (
            <View key={item.id} style={{ width: SCREEN_W, flex: 1 }}>
              <OnboardingSlide slide={item} />
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 }}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: index === currentIndex ? activeSlide.accentColor : '#D1D5DB',
              marginHorizontal: 4,
            }}
          />
        ))}
      </View>

      <View style={{ paddingHorizontal: 32, paddingBottom: 8 }}>
        <TouchableOpacity
          onPress={goNext}
          activeOpacity={0.85}
          style={{
            width: '100%',
            backgroundColor: activeSlide.accentColor,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 16, color: '#FFFFFF', fontWeight: '700' }}>
            {isLast ? 'Comenzar!' : 'Siguiente'}
          </Text>
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity onPress={onFinish} style={{ paddingVertical: 12 }} activeOpacity={0.6}>
            <Text style={{ fontSize: 14, color: '#94A3B8', fontWeight: '500', textAlign: 'center' }}>
              Omitir onboarding
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
