// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { tv } from '../platform/native/tv';
const cache = new Map<string, string | undefined>();
const jobs: {
  id: string;
  kind: string;
  done: (value: string | undefined) => void;
}[] = [];
let workers = 0;
function pump() {
  while (workers < 2 && jobs.length) {
    const job = jobs.shift()!;
    workers++;
    void tv
      .execute('image', { id: job.id, kind: job.kind })
      .then((value) => {
        const image =
          typeof value.image === 'string' &&
          value.image.length < 900000 &&
          value.image.startsWith('data:image/png;base64,')
            ? value.image
            : undefined;
        cache.set(job.id + '|' + job.kind, image);
        while (cache.size > 64) cache.delete(cache.keys().next().value!);
        job.done(image);
      })
      .catch(() => job.done(undefined))
      .finally(() => {
        workers--;
        pump();
      });
  }
}
export function useNativeImage(
  id: string,
  kind: 'icon' | 'banner',
  enabled = true,
) {
  const [image, setImage] = useState<string>();
  useEffect(() => {
    let active = true;
    setImage(undefined);
    if (!enabled) return;
    const key = id + '|' + kind;
    if (cache.has(key)) {
      setImage(cache.get(key));
      return;
    }
    jobs.push({
      id,
      kind,
      done: (value) => {
        if (active) setImage(value);
      },
    });
    pump();
    return () => {
      active = false;
    };
  }, [id, kind, enabled]);
  return image;
}
export function NativeAppImage({
  id,
  hero = false,
  fallback,
}: {
  id: string;
  hero?: boolean;
  fallback: React.ReactNode;
}) {
  const banner = useNativeImage(id, 'banner');
  const icon = useNativeImage(id, 'icon', !banner);
  if (hero)
    return banner ? (
      <Image
        source={{ uri: banner }}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
    ) : (
      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        {icon ? (
          <Image
            source={{ uri: icon }}
            resizeMode="contain"
            style={{ width: 150, height: 150, borderRadius: 28 }}
          />
        ) : (
          fallback
        )}
      </View>
    );
  return banner ? (
    <Image
      source={{ uri: banner }}
      resizeMode="cover"
      style={[StyleSheet.absoluteFill, { borderRadius: 13 }]}
    />
  ) : icon ? (
    <Image
      source={{ uri: icon }}
      resizeMode="contain"
      style={{ width: '72%', height: '72%', borderRadius: 14 }}
    />
  ) : (
    <>{fallback}</>
  );
}
