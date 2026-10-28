// SPDX-License-Identifier: AGPL-3.0-only
import { neighbor, type Direction } from '../../model/navigation.ts';
export interface NativeHandle {
  requestTVFocus?: () => void;
  focus?: () => void;
  measureInWindow?: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
  setNativeProps?: (props: Record<string, unknown>) => void;
}
interface Node {
  id: string;
  group: string;
  target: () => NativeHandle | null;
  press: () => void;
  hold?: () => void;
  box?: { x: number; y: number; width: number; height: number };
}
const nodes = new Map<string, Node>(),
  listeners = new Set<() => void>(),
  focusListeners = new Set<(id: string) => void>();
let groups = new Set<string>();
let current = '';
let revision = 0,
  transition = 0,
  transitioning = false;
let coordinateScale = 1;
function space(node: Node) {
  if (node.id.startsWith('app:')) return 'page-2-content';
  if (node.id.startsWith('input:')) return 'page-1-content';
  if (node.id === 'panel-close') return 'modal-header';
  return node.group;
}
const publish = () => {
  revision++;
  for (const listener of listeners) listener();
};
export const nativeFocus = {
  get coordinateScale() {
    return coordinateScale;
  },
  set coordinateScale(value: number) {
    coordinateScale = value;
  },
  get transitioning() {
    return transitioning;
  },
  beginTransition() {
    transitioning = true;
    return ++transition;
  },
  endTransition(token: number) {
    if (token === transition) transitioning = false;
  },
  shiftSpace(name: string, dx: number, dy: number) {
    for (const node of nodes.values())
      if (space(node) === name && node.box) {
        node.box = { ...node.box, x: node.box.x + dx, y: node.box.y + dy };
      }
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  get revision() {
    return revision;
  },
  allowed(group: string) {
    return groups.size === 0 || groups.has(group);
  },
  scope(next: string[]) {
    if (next.join('|') === [...groups].join('|')) return;
    groups = new Set(next);
    publish();
  },
  register(node: Node) {
    nodes.set(node.id, node);
    this.measure(node.id);
    return () => {
      if (nodes.get(node.id) === node) nodes.delete(node.id);
    };
  },
  measure(id: string, done?: () => void) {
    const node = nodes.get(id);
    const target = node?.target();
    if (!target?.measureInWindow) {
      done?.();
      return;
    }
    target.measureInWindow((x, y, width, height) => {
      if (node && width > 0 && height > 0 && nodes.get(id) === node)
        node.box = { x, y, width, height };
      done?.();
    });
  },
  focused(id: string) {
    current = id;
    for (const listener of focusListeners) listener(id);
  },
  onFocus(listener: (id: string) => void) {
    focusListeners.add(listener);
    return () => {
      focusListeners.delete(listener);
    };
  },
  measureGroup(group: string, done?: () => void) {
    const matching = [...nodes.values()].filter((node) => node.group === group);
    if (!done) {
      for (const node of matching) this.measure(node.id);
      return;
    }
    let remaining = matching.length,
      finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      done();
    };
    const timer = setTimeout(finish, 100);
    if (!remaining) {
      finish();
      return;
    }
    for (const node of matching)
      this.measure(node.id, () => {
        if (--remaining === 0) finish();
      });
  },
  get current() {
    return current;
  },
  get group() {
    return nodes.get(current)?.group;
  },
  node(id: string) {
    return nodes.get(id);
  },
  focus(id: string) {
    const node = nodes.get(id);
    if (!node || !this.allowed(node.group)) return;
    current = id;
    const target = node.target();
    if (target?.requestTVFocus) target.requestTVFocus();
    else if (target?.focus) target.focus();
    else {
      target?.setNativeProps?.({ hasTVPreferredFocus: false });
      requestAnimationFrame(() =>
        target?.setNativeProps?.({ hasTVPreferredFocus: true }),
      );
    }
  },
  press(id = current) {
    const node = nodes.get(id);
    if (node && this.allowed(node.group)) node.press();
  },
  hold() {
    nodes.get(current)?.hold?.();
  },
  move(direction: Direction) {
    const eligible = [...nodes.values()].filter((node) =>
      this.allowed(node.group),
    );
    const measured = eligible
      .filter((node) => node.box)
      .map((node) => ({ id: node.id, ...node.box! }));
    const next = neighbor(measured, current, direction);
    if (next) {
      this.focus(next);
      return true;
    }
    return false;
  },
};
