// SPDX-License-Identifier: AGPL-3.0-only
import React,{useState} from 'react';
import {heroMarkSize} from '../model/heroMark';
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
  const [heroSize,setHeroSize]=useState({width:112,height:90});
  const image = useNativeImage('brand:' + brand, hero?'hero-icon':'icon');
  return (
    <View style={{ alignItems: 'center', gap: 8, width: hero ? 160 : 65, height:hero?108:undefined,justifyContent:'center' }}>
      {image ? (
        <Image
          source={{ uri: image }}
          resizeMode="contain"
          onLoad={hero?event=>{const source=event.nativeEvent.source;if(source.width&&source.height)setHeroSize(heroMarkSize(source.width,source.height));}:undefined}
          style={hero?heroSize:{width:52,height:44}}
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
  const systemImage = useNativeImage(app.id, hero?'hero-icon':'icon', brands.length === 0);
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
      {hero&&app.kind==='live'?<Icon name="tv" size={100}/>:brands.length ? (
        brands.map(([brand, name]) => (
          <Mark key={brand} brand={brand!} name={name!} hero={hero} />
        ))
      ) : systemImage ? (
        <Image
          source={{ uri: systemImage }}
          resizeMode="contain"
          style={{ width: hero ? 100 : 50, height: hero ? 100 : 50 }}
        />
      ) : (
        <Icon name={app.icon} size={hero ? 100 : 44} />
      )}
    </View>
  );
}
