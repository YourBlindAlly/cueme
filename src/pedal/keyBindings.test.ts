import {
  DEFAULT_KEY_BINDINGS,
  HID_USAGE,
  resolveAction,
  setBinding,
} from './keyBindings';

describe('resolveAction', () => {
  it('resolves default right arrow / page down / space to next', () => {
    expect(resolveAction(HID_USAGE.RIGHT_ARROW, DEFAULT_KEY_BINDINGS)).toBe('next');
    expect(resolveAction(HID_USAGE.PAGE_DOWN, DEFAULT_KEY_BINDINGS)).toBe('next');
    expect(resolveAction(HID_USAGE.SPACEBAR, DEFAULT_KEY_BINDINGS)).toBe('next');
  });

  it('resolves default left arrow / page up / up arrow / enter to previous', () => {
    expect(resolveAction(HID_USAGE.LEFT_ARROW, DEFAULT_KEY_BINDINGS)).toBe('previous');
    expect(resolveAction(HID_USAGE.PAGE_UP, DEFAULT_KEY_BINDINGS)).toBe('previous');
    expect(resolveAction(HID_USAGE.UP_ARROW, DEFAULT_KEY_BINDINGS)).toBe('previous');
    expect(resolveAction(HID_USAGE.ENTER, DEFAULT_KEY_BINDINGS)).toBe('previous');
  });

  it('resolves default down arrow to next', () => {
    expect(resolveAction(HID_USAGE.DOWN_ARROW, DEFAULT_KEY_BINDINGS)).toBe('next');
  });

  it('returns null for an unbound key', () => {
    expect(resolveAction(999, DEFAULT_KEY_BINDINGS)).toBeNull();
  });
});

describe('setBinding', () => {
  it('assigns a fresh key to an action', () => {
    const result = setBinding([], 'next', 99, 'Custom Key');
    expect(result).toEqual([{ action: 'next', keyCode: 99, keyName: 'Custom Key' }]);
  });

  it('replaces all previous bindings for the same action with the new one', () => {
    const result = setBinding(DEFAULT_KEY_BINDINGS, 'next', 99, 'Custom Key');
    const nextBindings = result.filter((b) => b.action === 'next');
    expect(nextBindings).toEqual([{ action: 'next', keyCode: 99, keyName: 'Custom Key' }]);
    // previous bindings are untouched
    expect(resolveAction(HID_USAGE.LEFT_ARROW, result)).toBe('previous');
  });

  it('removes a conflicting binding on the same key from a different action', () => {
    const bindings = [{ action: 'next' as const, keyCode: 5, keyName: 'Foo' }];
    const result = setBinding(bindings, 'previous', 5, 'Foo');
    expect(result).toEqual([{ action: 'previous', keyCode: 5, keyName: 'Foo' }]);
  });
});
