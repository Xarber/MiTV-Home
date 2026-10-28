// SPDX-License-Identifier: AGPL-3.0-only
import type { NativeSnapshot } from './types';
export function nativeSnapshot(value: Record<string, unknown>): NativeSnapshot {
  if (
    value.schema !== 1 ||
    !Array.isArray(value.catalog) ||
    value.catalog.length > 330
  )
    throw new Error('invalid_native_response');
  for (const entry of value.catalog)
    if (
      !entry ||
      typeof entry.id !== 'string' ||
      entry.id.length > 512 ||
      typeof entry.name !== 'string' ||
      ![
        'app',
        'hdmi',
        'live',
        'library',
        'inputs',
        'airplay',
        'settings',
      ].includes(entry.kind)
    )
      throw new Error('invalid_native_response');
  const prefs = value.preferences as NativeSnapshot['preferences'] | undefined;
  if (
    !prefs ||
    !Array.isArray(prefs.dock) ||
    prefs.dock.length !== 6 ||
    new Set(prefs.dock).size !== 6 ||
    prefs.dock.some(
      (id, index) => typeof id !== 'string' || (index < 5 && id === 'all'),
    ) ||
    !['en', 'it'].includes(prefs.language) ||
    typeof prefs.glass !== 'boolean' ||
    typeof prefs.motion !== 'boolean'
  )
    throw new Error('invalid_native_response');
  if (!value.music || !value.network || !value.paired || !value.build)
    throw new Error('invalid_native_response');
  return value as unknown as NativeSnapshot;
}
