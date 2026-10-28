// SPDX-License-Identifier: AGPL-3.0-only
import React, { createContext, useContext, useLayoutEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { nativeFocus } from '../platform/native/focus';
interface Canvas {
  width: number;
  height: number;
  scale: number;
}
const Context = createContext<Canvas | null>(null);
/** Android TV density must not change the desktop design's visual proportions. */
export function TVCanvas({ children }: { children: React.ReactNode }) {
  const window = useWindowDimensions();
  const width = 1440,
    scale = window.width / width,
    height = window.height / scale;
  useLayoutEffect(() => {
    nativeFocus.coordinateScale = scale;
    return () => {
      nativeFocus.coordinateScale = 1;
    };
  }, [scale]);
  return (
    <Context.Provider value={{ width, height, scale }}>
      <View style={{ flex: 1, overflow: 'hidden', backgroundColor: '#0a101c' }}>
        <View
          style={{
            width,
            height,
            transform: [{ scale }],
            transformOrigin: 'top left',
          }}
        >
          {children}
        </View>
      </View>
    </Context.Provider>
  );
}
export function useCanvasDimensions() {
  const window = useWindowDimensions(),
    canvas = useContext(Context);
  return canvas ? { ...window, ...canvas } : { ...window, scale: 1 };
}
