// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { catalog, entry, defaultDock, type AppEntry } from '../model/catalog';
import {usePanelNavigation} from '../hooks/usePanelNavigation';
import { useDemo } from '../hooks/useDemo';
import { nativeFocus } from '../platform/native/focus';
import { tv, nativeSnapshot, type TVEvent } from '../platform/native/tv';
import type { Launcher, NativeSnapshot } from './types';
export function usePreviewLauncher(): Launcher {
  const demo = useDemo();
  return {
    ...demo,
    native: false,
    ready: true,
    catalog,
    entry,
    refresh: () => {},
    execute: async () => ({}),
    pairedRequest: async () => ({}),
  };
}
export function useNativeLauncher(): Launcher {
  const [snapshot, setSnapshot] = useState<NativeSnapshot>();
  const [error, setError] = useState<string>();
  const {panel,setPanel,back,close,canGoBack}=usePanelNavigation();
  const current = useRef(snapshot);
  const viewHash = useRef('');
  const [page, setPage] = useState(0),
    [selected, setSelected] = useState(''),
    [notice, setNotice] = useState(''),
    [filter, setFilter] = useState('all'),
    [artwork, setArtwork] = useState<string>();
  const busy = useRef(false),
    generation = useRef(0),
    artworkId = useRef<string | undefined>(undefined);
  const first = useRef(true);
  const resumePairing=useRef(true);
  const accept = useCallback((value: Record<string, unknown>) => {
    const next = nativeSnapshot(value);
    current.current = next;
    const hash = JSON.stringify({
      ...next,
      network: { ...next.network, observedAt: undefined },
      music: { ...next.music, observedAt: undefined },
    });
    if (hash !== viewHash.current) {
      viewHash.current = hash;
      setSnapshot(next);
    }
    setSelected((id) =>
      next.catalog.some((item) => item.id === id)
        ? id
        : next.preferences.dock[0]!,
    );
    setError(undefined);
    if(resumePairing.current){resumePairing.current=false;if(next.paired.pending)setPanel('pair');}
    if (first.current) {
      setSelected(next.preferences.dock[0]!);
      if (next.releasePending&&!next.paired.pending) setPanel('whatsnew');
      tv.ready();
      first.current = false;
    }
    return next;
  }, []);
  const refresh = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    const stamp = generation.current;
    void tv
      .execute('snapshot')
      .then((value) => {
        if (stamp !== generation.current) return;
        const next = accept(value);
        const id = next.music.active ? next.music.artworkId : undefined;
        if (id !== artworkId.current) {
          artworkId.current = id;
          setArtwork(undefined);
          if (id)
            void tv
              .execute('artwork')
              .then((art) => {
                if (
                  artworkId.current === id &&
                  typeof art.image === 'string' &&
                  /^data:image\/(png|jpeg);base64,/.test(art.image)
                )
                  setArtwork(art.image);
              })
              .catch(() => {});
        }
      })
      .catch(() => {
        setError('The television is not ready. Retry to reconnect.');
      })
      .finally(() => {
        busy.current = false;
      });
  }, [accept]);
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const active = () => {
      refresh();
      timer = setInterval(refresh, 1500);
    };
    active();
    const subscription = AppState.addEventListener('change', (state) => {
      clearInterval(timer);
      generation.current++;
      if (state === 'active') {resumePairing.current=true;active();}
    });
    return () => {
      clearInterval(timer);
      generation.current++;
      subscription.remove();
    };
  }, [refresh]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(
    () =>
      tv.subscribe((event: TVEvent) => {
        if(event.type==='playback')refresh();
        if(event.type==='home-resumed'){resumePairing.current=true;refresh();}
        if (event.type === 'home') {
          resumePairing.current=true;
          void tv.execute('snapshot').then(value=>{
            const next=accept(value);
            if(next.paired.pending){setPanel('pair');return;}
            setPage(0);setPanel(null);setSelected(next.preferences.dock[0]??'');
            setTimeout(()=>nativeFocus.focus('dock:'+next.preferences.dock[0]),350);
          }).catch(refresh);
        }
        if (event.type === 'paired') {
          setPanel((value) => (value === 'remote' ? null : value));
          setNotice('Remote connected');
          refresh();
        }
        if (
          event.type === 'notice' &&
          typeof event.payload.message === 'string'
        )
          setNotice(event.payload.message);
        if (
          event.type === 'pair-request' &&
          typeof event.payload.pin === 'string'
        )
          setPanel((value) => {
            if (value !== 'remote')
              setNotice('Pairing code  ' + event.payload.pin);
            return value;
          });
      }),
    [accept,refresh],
  );
  const execute = useCallback(
    async (operation: string, payload: Record<string, unknown> = {}) => {
      try {
        const value = await tv.execute(operation, payload);
        if (value.error) throw new Error('action_unavailable');
        if (value.schema === 1 && value.catalog) accept(value);
        else refresh();
        return value;
      } catch (failure) {
        setNotice('This action is unavailable. Please try again.');
        throw failure;
      }
    },
    [accept, refresh],
  );
  const pairedRequest = useCallback(
    async (operation: string, payload: Record<string, unknown> = {}) => {
      const value = await tv.pairedRequest(operation, payload);
      refresh();
      return value;
    },
    [refresh],
  );
  const mutate = (payload: Record<string, unknown>) => {
    void execute('preferences', payload).catch(() => {});
  };
  const prefs = snapshot?.preferences ?? {
    dock: [],
    wallpaper: 'silk',
    motion: false,
    language: 'it' as const,
    glass: true,
  };
  const lookup = useCallback(
    (id: string) =>
      current.current?.catalog.find((value) => value.id === id) ??
      ({
        id,
        name: 'Unavailable',
        icon: 'apps',
        color: '#454b59',
        category: 'system',
      } as AppEntry),
    [],
  );
  const media = (action: string, value?: number) => {
    const music = current.current?.music;
    if (!music?.active) return;
    void execute('media', {
      source: music.source,
      action,
      ...(value === undefined ? {} : { value }),
    }).catch(() => {});
  };
  const volume = snapshot?.volume ?? 0;
  const change: Launcher['change'] = (payload) => {
    mutate(payload);
  };
  const setVolume: Launcher['setVolume'] = (value) => {
    const next = typeof value === 'function' ? value(volume) : value;
    void execute('volume', { value: next }).catch(() => {});
  };
  const pin = (id: string, slot: number) => {
    if (!snapshot || slot < 0 || slot > 5 || (id === 'all' && slot !== 5))
      return;
    const next = [...prefs.dock],
      previous = next.indexOf(id);
    if (previous >= 0 && previous !== slot) {
      let displaced = next[slot]!;
      next[slot] = id;
      if (displaced === 'all' && previous < 5)
        displaced =
          snapshot.catalog.find(
            (value) => value.id !== 'all' && !next.includes(value.id),
          )?.id ?? next[previous]!;
      next[previous] = displaced;
    } else next[slot] = id;
    mutate({ dock: next });
  };
  const remove = (id: string) => {
    const index = prefs.dock.indexOf(id);
    if (index < 0 || !snapshot) return;
    const next = [...prefs.dock];
    const replacement =
      index === 5
        ? 'all'
        : snapshot.catalog.find(
            (value) => value.id !== 'all' && !next.includes(value.id),
          )?.id;
    if (!replacement) return;
    next[index] = replacement;
    mutate({ dock: next });
  };
  return {
    native: true,
    ready: !!snapshot,
    error,
    snapshot,
    catalog: snapshot?.catalog ?? [],
    entry: lookup,
    artwork,
    refresh,
    execute,
    pairedRequest,
    prefs,
    change,
    page,
    setPage,
    selected,
    setSelected,
    panel,
    setPanel,
    notice,
    setNotice,
    filter,
    setFilter,
    playing: snapshot?.music.playing === true,
    music: snapshot?.music.active === true,
    track: 0,
    position: (snapshot?.music.positionMs ?? 0) / 1000,
    setPosition: () => {},
    volume,
    setVolume,
    remote: snapshot?.remoteConnected === true,
    setRemote: () => {},
    start: () => {},
    toggle: () => media('play_pause'),
    next: (delta = 1) => media(delta < 0 ? 'previous' : 'next'),
    close,back,canGoBack,
    pin,
    remove,
    reset: () => {
      setNotice('Your saved television settings have not been changed.');
    },
  };
}
