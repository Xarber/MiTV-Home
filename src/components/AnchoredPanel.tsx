// SPDX-License-Identifier: AGPL-3.0-only
import { useCanvasDimensions } from './TVCanvas';
import { Glass } from './Glass';
import { nativeFocus } from '../platform/native/focus';
import React, { useEffect, useState } from 'react';
import {
  View,
  Platform,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  useReducedMotion,
  interpolate,
} from 'react-native-reanimated';
export interface Anchor {
  left: number;
  top: number;
  width: number;
  height: number;
}
export function anchorFor(id: string, fallback: Anchor): Anchor {
  if (Platform.OS !== 'web') {
    const rect = nativeFocus.node(id)?.box;
    return rect
      ? {
          left: rect.x / nativeFocus.coordinateScale,
          top: rect.y / nativeFocus.coordinateScale,
          width: rect.width / nativeFocus.coordinateScale,
          height: rect.height / nativeFocus.coordinateScale,
        }
      : fallback;
  }
  const element = document.querySelector<HTMLElement>(`[data-nav="${id}"]`);
  if (!element) return fallback;
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}
/** Only the childless material layer changes size. Content stays at its final
 * layout, revealing with opacity/transform so text and artwork never stretch. */
export function AnchoredPanel({
  kind,
  anchor,
  visible,
  close,
  children,
  bounds,
}: {
  kind: 'music' | 'settings';
  anchor: Anchor;
  visible: boolean;
  close: () => void;
  children: React.ReactNode;
  bounds?: { width: number; height: number };
}) {
  const viewport = useCanvasDimensions();
  const { width, height } = bounds ?? viewport;
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const [measured, setMeasured] = useState(0);
  const [origin, setOrigin] = useState(anchor);
  const music = kind === 'music';
  const targetWidth = Math.min(music ? 470 : 430, width - 40);
  const left = music
    ? Math.min(anchor.left, width - targetWidth - 20)
    : width - targetWidth - 20;
  const top = music ? Math.max(20, anchor.top) : 20;
  const maxHeight = height - top - 54;
  const targetHeight = music ? Math.min(measured || 350, maxHeight) : maxHeight;
  useEffect(() => {
    setOrigin(
      visible
        ? anchor
        : anchorFor(music ? 'activity-music' : 'header-settings', anchor),
    );
  }, [visible, anchor, music]);
  useEffect(() => {
    progress.set(
      withTiming(visible ? 1 : 0, {
        duration: reduced ? 0 : 280,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
      }),
    );
  }, [visible, reduced]);
  const material = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      left: interpolate(p, [0, 1], [origin.left, left]),
      top: interpolate(p, [0, 1], [origin.top, top]),
      width: interpolate(p, [0, 1], [origin.width, targetWidth]),
      height: interpolate(p, [0, 1], [origin.height, targetHeight]),
      borderRadius: interpolate(p, [0, 1], [25, 28]),
      opacity: reduced ? p : 1,
    };
  });
  const content = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.25, 1], [0, 0, 1]),
    transform: [{ translateY: reduced ? 0 : (1 - progress.get()) * -6 }],
  }));
  const backdrop = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const autoClose = () => {
    if (Platform.OS === 'web') {
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        document.getElementById('demo-panel-content')?.contains(active)
      )
        active.blur();
    }
    close();
  };
  useEffect(() => {
    if (!music || !visible || Platform.OS !== 'web') return;
    const changed = (event: FocusEvent) => {
      const panel = document.getElementById('demo-panel-content');
      if (panel && !panel.contains(event.target as Node)) close();
    };
    document.addEventListener('focusin', changed);
    return () => document.removeEventListener('focusin', changed);
  }, [music, visible, close]);
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={visible ? 'box-none' : 'none'}
      accessibilityViewIsModal={visible && !music}
      accessibilityElementsHidden={!visible}
      nativeID="demo-dialog"
      accessibilityLabel={music ? 'Now playing' : 'Control Center'}
    >
      <Pressable
        accessible={false}
        tabIndex={-1}
        style={StyleSheet.absoluteFill}
        onPress={music ? autoClose : close}
      />
      {!music && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, backdrop]}
        >
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(0,3,10,.08)' },
            ]}
          />
          {[2, 8, 18].map((blur, index) => (
            <View
              key={blur}
              style={[
                StyleSheet.absoluteFill,
                Platform.OS === 'web'
                  ? {
                      backdropFilter: `blur(${blur}px)`,
                      maskImage: `linear-gradient(to right, transparent ${35 + index * 15}%, black 100%)`,
                    }
                  : ({ backgroundColor: 'rgba(0,3,10,.03)' } as object),
              ]}
            />
          ))}
        </Animated.View>
      )}
      <Animated.View
        nativeID="demo-panel-material"
        pointerEvents="none"
        style={[
          s.material,
          { backgroundColor: music ? 'rgba(0,0,0,.90)' : 'rgba(15,19,28,.84)' },
          material,
        ]}
      >
        <Glass strong={!music} shade={music ? 0.85 : 0.58} />
      </Animated.View>
      <Animated.View
        nativeID="demo-panel-content"
        onPointerLeave={music ? autoClose : undefined}
        onLayout={(event) => {
          if (music) setMeasured(event.nativeEvent.layout.height);
        }}
        style={[
          s.content,
          {
            left,
            top,
            width: targetWidth,
            maxHeight,
            ...(!music ? { height: targetHeight } : {}),
          },
          content,
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}
const s = StyleSheet.create({
  material: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff20',
    boxShadow: '0 24px 80px #0005',
    ...Platform.select({
      web: { backdropFilter: 'blur(24px) saturate(1.15)' } as object,
    }),
  },
  content: {
    position: 'absolute',
    padding: 16,
    borderRadius: 28,
    overflow: 'hidden',
  },
});
