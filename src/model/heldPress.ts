// SPDX-License-Identifier: AGPL-3.0-only
export type ConfirmKey = 'select' | 'back';
interface Scheduler {
  schedule: (task: () => void, delay: number) => unknown;
  cancel: (handle: unknown) => void;
}
interface Actions {
  context: () => string | null;
  hold: (key: ConfirmKey, id: string) => void;
  release: (key: ConfirmKey, id: string) => void;
}
/** Own a physical press independently of React renders and popup focus changes. */
export class HeldPress {
  private pending?: {
    key: ConfirmKey;
    id: string;
    panel: string | null;
    held: boolean;
    timer: unknown;
  };
  private readonly actions: Actions;
  private readonly scheduler: Scheduler;
  constructor(actions: Actions, scheduler: Scheduler) {
    this.actions = actions;
    this.scheduler = scheduler;
  }
  down(key: ConfirmKey, id: string) {
    this.cancel();
    const pending = {
      key,
      id,
      panel: this.actions.context(),
      held: false,
      timer: undefined as unknown,
    };
    this.pending = pending;
    pending.timer = this.scheduler.schedule(() => {
      if (this.pending === pending) this.long(key);
    }, 550);
  }
  long(key: ConfirmKey) {
    const pending = this.pending;
    if (
      !pending ||
      pending.key !== key ||
      pending.held ||
      this.actions.context() !== pending.panel
    )
      return;
    this.scheduler.cancel(pending.timer);
    pending.held = true;
    this.actions.hold(key, pending.id);
  }
  up(key: ConfirmKey) {
    const pending = this.pending;
    if (!pending || pending.key !== key) return;
    this.scheduler.cancel(pending.timer);
    this.pending = undefined;
    if (!pending.held && this.actions.context() === pending.panel)
      this.actions.release(key, pending.id);
  }
  cancel() {
    if (this.pending) this.scheduler.cancel(this.pending.timer);
    this.pending = undefined;
  }
}
