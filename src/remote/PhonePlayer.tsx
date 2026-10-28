// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../components/Icon';
import { FocusButton } from '../components/FocusButton';
import { Waveform } from '../components/Music';
import { timeLabel } from '../model/catalog';
import type { RemoteMusic, MediaAction } from './types';
export function PhonePlayer({
  music,
  artwork,
  action,
  connected,
  group = 'phone-modal',
  prefix = 'phone-music',
  waveform,
  focusSummary = false,
  t = (value: string) => value,
}: {
  group?: string;
  prefix?: string;
  waveform?: React.ReactNode;
  focusSummary?: boolean;
  t?: (value: string) => string;
  music: RemoteMusic;
  artwork?: string;
  action: (key: MediaAction, value?: number) => void;
  connected: boolean;
}) {
  const progress =
    music.durationMs && music.positionMs !== undefined
      ? Math.max(0, Math.min(1, music.positionMs / music.durationMs))
      : 0;
  const summary = (
    <View style={s.summary}>
      {artwork ? (
        <Image source={{ uri: artwork }} style={s.art} />
      ) : (
        <LinearGradient
          colors={['#b293b4', '#526d83']}
          style={[s.art, { alignItems: 'center', justifyContent: 'center' }]}
        >
          <Icon name="music" size={36} />
        </LinearGradient>
      )}
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={s.title} numberOfLines={2}>
          {music.title || t('Music')}
        </Text>
        {!!music.artist && (
          <Text style={s.secondary} numberOfLines={1}>
            {music.artist}
          </Text>
        )}
        {!!music.album && (
          <Text style={s.caption} numberOfLines={1}>
            {music.album}
          </Text>
        )}
      </View>
      <View style={{ transform: [{ scale: 0.85 }] }}>
        {waveform ?? (
          <Waveform playing={!!music.playing && connected} track={0} />
        )}
      </View>
    </View>
  );
  return (
    <View>
      {focusSummary ? (
        <FocusButton
          id={prefix + '-summary'}
          group={group}
          label={music.title || t('Music')}
          onPress={() => {}}
          style={{ alignItems: 'stretch', padding: 2 }}
        >
          {summary}
        </FocusButton>
      ) : (
        summary
      )}
      {music.positionMs !== undefined && (
        <View style={{ marginTop: 18 }}>
          <View style={s.track}>
            <View
              style={{
                width: `${progress * 100}%`,
                height: 4,
                borderRadius: 3,
                backgroundColor: '#ddd',
              }}
            />
          </View>
          <View style={s.times}>
            <Text style={s.caption}>{timeLabel(music.positionMs / 1000)}</Text>
            {music.durationMs !== undefined && (
              <Text style={s.caption}>
                −
                {timeLabel(
                  Math.max(0, music.durationMs - music.positionMs) / 1000,
                )}
              </Text>
            )}
          </View>
        </View>
      )}
      <View style={s.buttons}>
        {(['previous', 'play_pause', 'next'] as const).map((key) => (
          <FocusButton
            key={key}
            id={prefix + '-' + key}
            group={group}
            label={t(
              key === 'play_pause'
                ? music.playing
                  ? 'Pause'
                  : 'Play'
                : key === 'next'
                  ? 'Next'
                  : 'Previous',
            )}
            disabled={!connected || !music.controls?.[key]}
            onPress={() => action(key)}
            style={{ width: 54, height: 54, borderRadius: 30 }}
          >
            <Icon
              name={
                key === 'play_pause' ? (music.playing ? 'pause' : 'play') : key
              }
              size={key === 'play_pause' ? 29 : 24}
            />
          </FocusButton>
        ))}
      </View>
      {music.volume !== undefined && (
        <View style={s.volume}>
          <Icon name="volume" size={16} />
          <FocusButton
            id={prefix + '-volume-minus'}
            group={group}
            label="Decrease volume"
            disabled={!connected || !music.controls?.volume}
            onPress={() => action('volume', Math.max(0, music.volume! - 5))}
          >
            <Text style={s.sign}>−</Text>
          </FocusButton>
          <View style={[s.track, { flex: 1 }]}>
            <View
              style={{
                width: `${music.volume}%`,
                height: 4,
                borderRadius: 4,
                backgroundColor: '#ddd',
              }}
            />
          </View>
          <FocusButton
            id={prefix + '-volume-plus'}
            group={group}
            label="Increase volume"
            disabled={!connected || !music.controls?.volume}
            onPress={() => action('volume', Math.min(100, music.volume! + 5))}
          >
            <Text style={s.sign}>+</Text>
          </FocusButton>
        </View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  art: { width: 70, height: 70, borderRadius: 17 },
  title: { color: '#fff', fontWeight: '700', fontSize: 18 },
  secondary: { color: '#c3c5ce', fontSize: 13 },
  caption: { color: '#949eaf', fontSize: 11, fontVariant: ['tabular-nums'] },
  track: {
    height: 4,
    backgroundColor: '#ffffff22',
    borderRadius: 4,
    overflow: 'hidden',
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 7,
  },
  volume: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  sign: { color: '#fff', fontSize: 22 },
});
