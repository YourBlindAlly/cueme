import { DoublePressDetector, DOUBLE_PRESS_WINDOW_MS } from './doublePressDetector';

describe('DoublePressDetector', () => {
  it('does not report a double press on a single press', () => {
    const d = new DoublePressDetector();
    expect(d.registerPress('next', 1000)).toBe(false);
  });

  it('reports a double press when the same action repeats within the window', () => {
    const d = new DoublePressDetector();
    expect(d.registerPress('next', 1000)).toBe(false);
    expect(d.registerPress('next', 1000 + DOUBLE_PRESS_WINDOW_MS - 1)).toBe(true);
  });

  it('does not report a double press when the gap exceeds the window', () => {
    const d = new DoublePressDetector();
    expect(d.registerPress('next', 1000)).toBe(false);
    expect(d.registerPress('next', 1000 + DOUBLE_PRESS_WINDOW_MS + 1)).toBe(false);
  });

  it('treats next and previous as independent — a next then a previous is not a double press', () => {
    const d = new DoublePressDetector();
    expect(d.registerPress('next', 1000)).toBe(false);
    expect(d.registerPress('previous', 1050)).toBe(false);
  });

  it('consumes the double press so a third rapid press starts a fresh count', () => {
    const d = new DoublePressDetector();
    expect(d.registerPress('next', 1000)).toBe(false);
    expect(d.registerPress('next', 1100)).toBe(true); // completes double press #1
    expect(d.registerPress('next', 1150)).toBe(false); // starts counting fresh
    expect(d.registerPress('next', 1200)).toBe(true); // completes double press #2
  });

  it('respects a custom window', () => {
    const d = new DoublePressDetector(1000);
    expect(d.registerPress('next', 0)).toBe(false);
    expect(d.registerPress('next', 999)).toBe(true);
  });
});
