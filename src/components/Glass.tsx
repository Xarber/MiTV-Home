// SPDX-License-Identifier: AGPL-3.0-only
import React, { createContext, useContext, type RefObject } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
export const GlassTarget = createContext<
  RefObject<React.ComponentRef<typeof View> | null> | undefined
>(undefined);
/** A live background target, never a cached screenshot. Blur intensity stays constant. */
export function Glass({
  strong = false,
  shade = 0.35,
}: {
  strong?: boolean;
  shade?: number;
}) {
  const target = useContext(GlassTarget);
  if (Platform.OS === 'web' || !target) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <BlurView
        pointerEvents="none"
        blurTarget={target}
        blurMethod="dimezisBlurView"
        blurReductionFactor={8}
        intensity={strong ? 90 : 45}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: `rgba(0,0,0,${shade})` },
        ]}
      />
    </View>
  );
}
