// SPDX-License-Identifier: AGPL-3.0-only
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
export { nativeSnapshot } from '../../launcher/snapshot';
interface TVModule {
  execute(operation: string, payload: string): Promise<string>;
  pairedRequest(operation: string, payload: string): Promise<string>;
  ready(): void;
  addListener(name: string): void;
  removeListeners(count: number): void;
}
const module = NativeModules.AureaTV as TVModule | undefined;
export const nativeTVAvailable = Platform.OS === 'android' && !!module;
export interface TVEvent {
  type: string;
  payload: Record<string, unknown>;
}
export const tvEvents = nativeTVAvailable
  ? new NativeEventEmitter(module!)
  : undefined;
function decode(value: string): Record<string, unknown> {
  if (value.length > 3000000) throw new Error('invalid_native_response');
  const result: unknown = JSON.parse(value);
  if (!result || typeof result !== 'object' || Array.isArray(result))
    throw new Error('invalid_native_response');
  return result as Record<string, unknown>;
}
export const tv = {
  async execute(operation: string, payload: Record<string, unknown> = {}) {
    if (!module) throw new Error('native_bridge_unavailable');
    return decode(await module.execute(operation, JSON.stringify(payload)));
  },
  async pairedRequest(
    operation: string,
    payload: Record<string, unknown> = {},
  ) {
    if (!module) throw new Error('native_bridge_unavailable');
    return decode(
      await module.pairedRequest(operation, JSON.stringify(payload)),
    );
  },
  ready() {
    module?.ready();
  },
  subscribe(listener: (event: TVEvent) => void) {
    const subscription = tvEvents?.addListener(
      'AureaTVEvent',
      (...args: readonly Object[]) => {
        const encoded = args[0];
        if (typeof encoded !== 'string') return;
        try {
          const value = decode(encoded);
          if (
            typeof value.type === 'string' &&
            value.payload &&
            typeof value.payload === 'object'
          )
            listener(value as unknown as TVEvent);
        } catch {
          /* malformed events cannot mutate launcher state */
        }
      },
    );
    return () => subscription?.remove();
  },
};
