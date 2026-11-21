import type { SavedCamera } from "@/lib/store/map-store";

/**
 * The camera is stored in each history entry (`history.state.camera`), so Back, Forward and
 * refresh restore it. Next keeps custom keys on Back/Forward and starts pushes with a clean state.
 */

const KEY = "camera";
const SAVE_DELAY = 300;

let timer: number | undefined;

export function readCamera(): SavedCamera | null {
  const saved = window.history.state?.[KEY] as SavedCamera | undefined;
  return saved && Number.isFinite(saved.x) && Number.isFinite(saved.ratio) ? saved : null;
}

export function writeCameraNow(camera: SavedCamera) {
  window.clearTimeout(timer);
  window.history.replaceState({ ...window.history.state, [KEY]: camera }, "");
}

/**
 * Debounced save while the camera moves. `belongsHere` is checked when the timer fires, so a
 * flight that starts before Next has pushed the new entry never lands on the previous one.
 */
export function writeCameraSoon(read: () => SavedCamera, belongsHere: () => boolean) {
  window.clearTimeout(timer);
  timer = window.setTimeout(function save() {
    if (belongsHere()) writeCameraNow(read());
    else timer = window.setTimeout(save, SAVE_DELAY);
  }, SAVE_DELAY);
}

export function cancelCameraWrite() {
  window.clearTimeout(timer);
}
