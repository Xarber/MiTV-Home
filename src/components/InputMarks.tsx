// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import { Image, View, Text } from 'react-native';
import { useNativeImage } from './NativeAppImage';
import { Icon } from './Icon';
import type { AppEntry } from '../model/catalog';
function Mark({
  brand,
  name,
  hero,
}: {
  brand: string;
  name: string;
  hero: boolean;
}) {
  const image = useNativeImage('brand:' + brand, 'icon');
  return (
    <View style={{ alignItems: 'center', gap: 8, width: hero ? 95 : 65 }}>
      {image ? (
        <Image
          source={{ uri: image }}
          resizeMode="contain"
          style={{ width: hero ? 78 : 48, height: hero ? 66 : 40 }}
        />
      ) : (
        <Icon name="game" size={36} />
      )}
      {!hero && (
        <Text
          numberOfLines={1}
          style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}
        >
          {name}
        </Text>
      )}
    </View>
  );
}
export function InputMarks({
  app,
  hero = false,
}: {
  app: AppEntry;
  hero?: boolean;
}) {
  const profile = app.profile;
  const brands =
    profile === 'nintendo'
      ? [
          ['nintendoswitch', 'Switch'],
          ['wiiu', 'Wii U'],
        ]
      : profile === 'gaming'
        ? [
            ['playstation', 'PlayStation 4'],
            ['xbox', 'Xbox'],
          ]
        : profile && profile !== 'generic'
          ? [
              [
                profile,
                (
                  {
                    appletv: 'Apple TV',
                    nintendoswitch: 'Switch',
                    playstation: 'PlayStation 4',
                    xbox: 'Xbox',
                    wiiu: 'Wii U',
                  } as Record<string, string>
                )[profile] ?? profile,
              ],
            ]
          : [];
  const systemImage = useNativeImage(app.id, 'icon', brands.length === 0);
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: hero ? 38 : 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hero ? 24 : 9,
      }}
    >
      {brands.length ? (
        brands.map(([brand, name]) => (
          <Mark key={brand} brand={brand!} name={name!} hero={hero} />
        ))
      ) : systemImage ? (
        <Image
          source={{ uri: systemImage }}
          resizeMode="contain"
          style={{ width: hero ? 80 : 46, height: hero ? 80 : 46 }}
        />
      ) : (
        <Icon name={app.icon} size={hero ? 80 : 40} />
      )}
    </View>
  );
}
