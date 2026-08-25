export type PedalAction = 'next' | 'previous';

export type KeyBinding = {
  action: PedalAction;
  keyCode: number;
  keyName: string;
};

// USB HID Keyboard/Keypad usage IDs — GCKeyCode's rawValue is defined as this
// same standard usage ID, so these constants double as sensible out-of-the-box
// defaults for common pedals (which usually emulate arrow keys, Page Up/Down,
// or Space) while staying fully remappable from Settings for any pedal that
// sends something else.
export const HID_USAGE = {
  RIGHT_ARROW: 0x4f,
  LEFT_ARROW: 0x50,
  DOWN_ARROW: 0x51,
  UP_ARROW: 0x52,
  PAGE_UP: 0x4b,
  PAGE_DOWN: 0x4e,
  SPACEBAR: 0x2c,
} as const;

export const DEFAULT_KEY_BINDINGS: KeyBinding[] = [
  { action: 'next', keyCode: HID_USAGE.RIGHT_ARROW, keyName: 'Right Arrow' },
  { action: 'next', keyCode: HID_USAGE.PAGE_DOWN, keyName: 'Page Down' },
  { action: 'next', keyCode: HID_USAGE.SPACEBAR, keyName: 'Spacebar' },
  { action: 'previous', keyCode: HID_USAGE.LEFT_ARROW, keyName: 'Left Arrow' },
  { action: 'previous', keyCode: HID_USAGE.PAGE_UP, keyName: 'Page Up' },
];

/** Which action (if any) a raw key code currently maps to. */
export function resolveAction(
  keyCode: number,
  bindings: KeyBinding[]
): PedalAction | null {
  return bindings.find((binding) => binding.keyCode === keyCode)?.action ?? null;
}

/**
 * Returns a new binding list with any existing binding(s) for `action`
 * replaced by a single binding on `keyCode`/`keyName`, and any other action
 * previously bound to that same key removed (a key can only mean one thing).
 */
export function setBinding(
  bindings: KeyBinding[],
  action: PedalAction,
  keyCode: number,
  keyName: string
): KeyBinding[] {
  const withoutConflicts = bindings.filter(
    (binding) => binding.action !== action && binding.keyCode !== keyCode
  );
  return [...withoutConflicts, { action, keyCode, keyName }];
}
