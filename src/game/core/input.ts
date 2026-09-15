/**
 * One input surface for keyboard and touch.
 *
 * Deliberately a plain mutable object rather than React state: the controller
 * reads it every simulation step, and routing that through React would re-render
 * the tree 120 times a second. The touch joystick writes into the same object,
 * so the controller never learns which device it is talking to.
 */

export interface InputState {
  /** -1 (left) to 1 (right). Analogue on touch, binary on keyboard. */
  moveX: number;
  /** -1 (down) to 1 (up). Used for ladders. */
  moveY: number;
  /** Timestamp (seconds) of the last jump press, for jump buffering. */
  jumpAt: number;
  /** True while a jump control is held — lets us cut a jump short. */
  jumpHeld: boolean;
  /** Set on press, cleared once the game acts on it. */
  actionQueued: boolean;
}

export const input: InputState = {
  moveX: 0,
  moveY: 0,
  jumpAt: -Infinity,
  jumpHeld: false,
  actionQueued: false,
};

/** Consumes a queued interaction. Returns true at most once per press. */
export function takeAction(): boolean {
  if (!input.actionQueued) return false;
  input.actionQueued = false;
  return true;
}

export function resetInput(): void {
  input.moveX = 0;
  input.moveY = 0;
  input.jumpHeld = false;
  input.actionQueued = false;
  input.jumpAt = -Infinity;
}

const LEFT = new Set(["ArrowLeft", "KeyA"]);
const RIGHT = new Set(["ArrowRight", "KeyD"]);
const UP = new Set(["ArrowUp", "KeyW"]);
const DOWN = new Set(["ArrowDown", "KeyS"]);
const JUMP = new Set(["Space", "ArrowUp", "KeyW"]);
const ACTION = new Set(["KeyE", "Enter"]);

/** Keys currently held, so releasing one of two held directions still works. */
const held = new Set<string>();

function applyKeyboardAxes(): void {
  let x = 0;
  let y = 0;
  for (const code of held) {
    if (LEFT.has(code)) x -= 1;
    if (RIGHT.has(code)) x += 1;
    if (UP.has(code)) y += 1;
    if (DOWN.has(code)) y -= 1;
  }
  input.moveX = Math.sign(x);
  input.moveY = Math.sign(y);
  input.jumpHeld = [...held].some((c) => JUMP.has(c));
}

/**
 * Attaches keyboard listeners. Returns a cleanup function.
 * `isPaused` lets an open panel swallow movement without tearing down input.
 */
export function attachKeyboard(
  now: () => number,
  isPaused: () => boolean,
): () => void {
  const onDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const code = e.code;
    const known =
      LEFT.has(code) || RIGHT.has(code) || UP.has(code) || DOWN.has(code) ||
      JUMP.has(code) || ACTION.has(code);
    if (!known) return;

    // Space and the arrows scroll the page otherwise.
    e.preventDefault();
    if (isPaused()) return;

    held.add(code);
    if (JUMP.has(code)) input.jumpAt = now();
    if (ACTION.has(code)) input.actionQueued = true;
    applyKeyboardAxes();
  };

  const onUp = (e: KeyboardEvent) => {
    if (!held.delete(e.code)) return;
    applyKeyboardAxes();
  };

  // A dropped keyup (tab switch, cmd-tab) would otherwise stick a key down.
  const onBlur = () => {
    held.clear();
    resetInput();
  };

  window.addEventListener("keydown", onDown, { passive: false });
  window.addEventListener("keyup", onUp);
  window.addEventListener("blur", onBlur);
  document.addEventListener("visibilitychange", onBlur);

  return () => {
    window.removeEventListener("keydown", onDown);
    window.removeEventListener("keyup", onUp);
    window.removeEventListener("blur", onBlur);
    document.removeEventListener("visibilitychange", onBlur);
    held.clear();
  };
}
