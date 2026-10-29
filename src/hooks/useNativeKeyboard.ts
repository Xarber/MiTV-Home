// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef } from 'react';
import { AppState, BackHandler, Platform } from 'react-native';
import { nativeFocus } from '../platform/native/focus';
import { tv } from '../platform/native/tv';
import {NativeInputGate} from '../model/nativeInput';
import { HeldPress } from '../model/heldPress';
interface Options {
  panel: string | null;
  close: () => void;
  control: () => void;
  page: number;
  changePage: (page: number) => void;
  menu: (id: string) => void;
  play: () => void;
}
/** Key-down ownership survives snapshot rerenders and a menu opening before key-up. */
export function useNativeKeyboard(options: Options) {
  const latest = useRef(options);
  latest.current = options;
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const blocking = options.panel !== null && options.panel !== 'music';
    nativeFocus.scope(
      blocking
        ? ['modal']
        : [
            'header',
            'page-' + options.page,
            ...(options.panel === 'music' ? ['modal'] : []),
          ],
    );
  }, [options.panel, options.page]);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const back = () => {
      const current = latest.current;
      if (current.panel) current.close();
      else if (current.page) current.changePage(0);
    };
    const press = new HeldPress(
      {
        context: () => latest.current.panel,
        hold: (key, id) => {
          const current = latest.current;
          if (key === 'back') current.control();
          else if (!current.panel)
            current.menu(id.split(':').slice(1).join(':'));
        },
        release: (key, id) => {
          if (key === 'select') nativeFocus.press(id);
          else back();
        },
      },
      {
        schedule: (task, delay) => setTimeout(task, delay),
        cancel: (handle) =>
          clearTimeout(handle as ReturnType<typeof setTimeout>),
      },
    );
    const directionsDown=new Map<string,number>(),gate=new NativeInputGate();
    const recover=()=>{press.cancel();gate.reset();directionsDown.clear();nativeFocus.recover();};
    const lifecycle=AppState.addEventListener('change',state=>{if(state==='active')recover();else{press.cancel();gate.reset();directionsDown.clear();nativeFocus.suspend();}});
    const unsubscribe = tv.subscribeInput((event) => {
      const current = latest.current;
      if(event.type==='home-resumed'){recover();return;}
      if (event.type === 'back') {
        back();
        return;
      }
      if (event.type !== 'key'||!gate.accept(event.payload.eventId)) return;
      const key = event.payload.key,
        phase = event.payload.phase,
        repeat = event.payload.repeat;
      if (key === 'select' || key === 'back') {
        if (phase === 'down' && repeat === 0)
          press.down(key, nativeFocus.current);
        if (phase === 'down' && event.payload.long === true) press.long(key);
        if (phase === 'up') press.up(key);
        return;
      }
      if(phase==='up'){if(typeof key==='string')directionsDown.delete(key);return;}
      if (phase !== 'down') return;
      if(typeof key==='string'&&['up','down','left','right'].includes(key)){const now=Date.now(),previous=directionsDown.get(key);if(previous!==undefined&&now-previous<(repeat===0?60:160))return;directionsDown.set(key,now);}
      if(key==='menu'){if(!current.panel&&nativeFocus.group?.startsWith('page-'))current.menu(nativeFocus.current.split(':').slice(1).join(':'));else current.control();return;}
      if (key === 'control') {
        current.control();
        return;
      }
      if (key === 'playpause') {
        current.play();
        return;
      }
      if (nativeFocus.transitioning) return;
      const directions = {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight',
      } as const;
      if (typeof key !== 'string' || !(key in directions)) return;
      const before = nativeFocus.group ?? 'none';
      const moved = nativeFocus.move(
        directions[key as keyof typeof directions],
      );
      void tv
        .execute('navigationTrace', {
          direction: key,
          from: before,
          to: nativeFocus.group ?? 'none',
          moved,
        })
        .catch(() => {});
      if (!moved && !current.panel && key === 'down' && current.page < 2)
        current.changePage(current.page + 1);
      if (!moved && !current.panel && key === 'up' && current.page > 0)
        current.changePage(current.page - 1);
      if (current.panel === 'music' && nativeFocus.group !== 'modal')
        current.close();
    });
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        back();
        return true;
      },
    );
    return () => {
      unsubscribe();
      subscription.remove();
      lifecycle.remove();
      press.cancel();
    };
  }, []);
}
