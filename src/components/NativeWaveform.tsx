// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
  interpolateColor,
} from 'react-native-reanimated';
import { tvEvents } from '../platform/native/tv';
/** Receiver bands reuse the existing volume-normalized DSP; remote-player bars are labelled animation. */
export function NativeWaveform({
  playing,
  source,
  colors = ['#e6eaf0', '#929aa8'],
  small = false,
}: {
  playing: boolean;
  source?: string;
  colors?: [string, string];
  small?: boolean;
}) {
  const reduced = useReducedMotion();
  const bands = useSharedValue([0.13, 0.13, 0.13, 0.13, 0.13, 0.13]);
  useEffect(() => {
    if (source !== 'airplay') return;
    const subscription = tvEvents?.addListener(
      'AureaTVWaveform',
      (...args: readonly Object[]) => {
        const encoded = args[0];
        if (typeof encoded !== 'string') return;
        try {
          const values: unknown = JSON.parse(encoded);
          if (
            Array.isArray(values) &&
            values.length === 6 &&
            values.every(
              (value) => typeof value === 'number' && Number.isFinite(value),
            )
          )
            bands.set(
              values.map((value) =>
                Math.max(
                  0.12,
                  Math.min(
                    0.92,
                    (20 * Math.log10(Math.max(0.0001, value)) + 52) / 46,
                  ),
                ),
              ),
            );
        } catch {}
      },
    );
    return () => subscription?.remove();
  }, [source]);
  return (
    <View
      accessibilityLabel={
        source === 'airplay' ? 'Audio spectrum' : 'Playback animation'
      }
      style={{
        height: small ? 22 : 28,
        flexDirection: 'row',
        alignItems: 'center',
        gap: small ? 2 : 3,
      }}
    >
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <Band
          key={index}
          index={index}
          bands={bands}
          small={small}
          playing={playing}
          animated={source !== 'airplay' && !reduced}
          colors={[
            interpolateColor(index / 6, [0, 1], colors),
            interpolateColor((index + 1) / 6, [0, 1], colors),
          ]}
        />
      ))}
    </View>
  );
}
function Band({
  index,
  bands,
  small,
  playing,
  animated,
  colors,
}: {
  index: number;
  bands: ReturnType<typeof useSharedValue<number[]>>;
  small: boolean;
  playing: boolean;
  animated: boolean;
  colors: [string, string];
}) {
  const reduced = useReducedMotion();
  const style = useAnimatedStyle(() => ({
    transform: [
      {
        scaleY: withTiming(playing ? (bands.get()[index] ?? 0.12) : 0.06, {
          duration: reduced ? 0 : 100,
        }),
      },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          width: small ? 2 : 3.5,
          height: small ? 20 : 28,
          borderRadius: 9,
          overflow: 'hidden',
          ...(animated && playing
            ? {
                animationName: {
                  from: { transform: [{ scaleY: 0.18 }] },
                  to: { transform: [{ scaleY: 0.5 + index * 0.07 }] },
                },
                animationDuration: 650 + index * 163,
                animationDirection: 'alternate' as const,
                animationIterationCount: 'infinite' as const,
              }
            : undefined),
        },
        (!animated || !playing) && style,
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{x:0,y:0}} end={{x:1,y:0}}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </Animated.View>
  );
}
