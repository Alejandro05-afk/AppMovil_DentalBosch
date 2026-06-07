import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
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
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLast = currentIndex === slides.length - 1;
  const activeSlide = slides[currentIndex];

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goNext = () => {
    if (isLast) { onFinish(); return; }
    flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
  };

  const goBack = () => {
    if (currentIndex === 0) return;
    flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
  };

  return (
    <View className="flex-1 bg-light-bg">
      <View className="flex-row justify-between items-center px-6 pt-4 pb-2">
        <Text className="text-primary font-bold" style={{ fontSize: 16 }}>
          DentalBosch
        </Text>
        {!isLast && (
          <TouchableOpacity onPress={onFinish} className="px-3 py-2" activeOpacity={0.6}>
            <Text style={{ fontSize: 14, color: '#94A3B8', fontWeight: '600' }}>
              Omitir
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => (
          <OnboardingSlide slide={item} isActive={index === currentIndex} />
        )}
        style={{ flex: 1 }}
      />

      <View className="px-6 pb-10 pt-2">
        <View className="flex-row justify-center items-center mb-7">
          {slides.map((_, index) => {
            const inputRange = [
              (index - 1) * SCREEN_W,
              index * SCREEN_W,
              (index + 1) * SCREEN_W,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 22, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={{
                  width: dotWidth,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: activeSlide.accentColor,
                  opacity,
                  marginHorizontal: 3,
                }}
              />
            );
          })}
        </View>

        <View className="flex-row items-center gap-3">
          {currentIndex > 0 && (
            <TouchableOpacity
              onPress={goBack}
              activeOpacity={0.7}
              style={{
                borderWidth: 1.5,
                borderColor: '#E2E8F0',
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 20,
                backgroundColor: '#FFFFFF',
              }}
            >
              <Text style={{ fontSize: 16, color: '#0F172A', fontWeight: '700' }}>←</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={goNext}
            activeOpacity={0.85}
            style={{
              flex: 1,
              backgroundColor: activeSlide.accentColor,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              shadowColor: activeSlide.accentColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 16, color: '#FFFFFF', fontWeight: '800' }}>
              {isLast ? '¡Comenzar!' : 'Siguiente'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}