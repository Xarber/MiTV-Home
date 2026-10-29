// SPDX-License-Identifier: AGPL-3.0-only
import React,{useEffect} from 'react';
import {useSharedValue} from 'react-native-reanimated';
import {Spectrum} from './Spectrum';
import {tvEvents} from '../platform/native/tv';
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
 return <Spectrum values={bands} playing={playing} decorative={source!=='airplay'} small={small} colors={colors} width={small?2:3.5} height={small?20:28} gap={small?2:3} label={source==='airplay'?'Audio spectrum':'Playback animation'}/>;
}
