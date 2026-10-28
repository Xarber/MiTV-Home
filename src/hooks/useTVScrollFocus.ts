// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, type ComponentRef, type RefObject } from 'react';
import { Platform, ScrollView } from 'react-native';
import { nativeFocus } from '../platform/native/focus';
export function useTVScrollFocus(
  reference: RefObject<ComponentRef<typeof ScrollView> | null>,
  group: string,
) {
  const offset = useRef(0);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    return nativeFocus.onFocus((id) => {
      const node = nativeFocus.node(id);
      if (node?.group !== group) return;
      requestAnimationFrame(() =>
        reference.current?.measureInWindow((x, y, width, height) =>
          node.target()?.measureInWindow?.((nx, ny, nw, nh) => {
            const top = y + 30,
              bottom = y + height - 30;
            const delta =
              ny < top ? ny - top : ny + nh > bottom ? ny + nh - bottom : 0;
            if (delta)
              reference.current?.scrollTo({
                y: Math.max(
                  0,
                  offset.current + delta / nativeFocus.coordinateScale,
                ),
                animated: true,
              });
          }),
        ),
      );
    });
  }, [reference, group]);
  return (value: number) => {
    nativeFocus.shiftSpace(
      group + '-content',
      0,
      -(value - offset.current) * nativeFocus.coordinateScale,
    );
    offset.current = value;
  };
}
