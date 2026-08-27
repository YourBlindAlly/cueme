import { useCallback, useEffect, useRef, useState } from 'react';
import CuemePedalInput from '../../modules/cueme-pedal-input/src/CuemePedalInputModule';
import type { KeyEventPayload } from '../../modules/cueme-pedal-input/src/CuemePedalInput.types';
import {
  loadAlertOnDisconnect,
  loadKeyBindings,
  saveAlertOnDisconnect,
  saveKeyBindings,
} from './bindingsStorage';
import { resolveAction, setBinding, type KeyBinding, type PedalAction } from './keyBindings';

type Options = {
  /** Called for every key press that resolves to a bound action (ignored while capturing a new binding). */
  onAction?: (action: PedalAction) => void;
  /** Called when the pedal disconnects, if the disconnect-alert setting is on. */
  onDisconnectAlert?: () => void;
  /** Called when the pedal (re)connects. */
  onConnectAlert?: () => void;
  /**
   * Called for every raw key-down event, regardless of bindings or capture
   * state — a diagnostic hook so Settings can show/speak exactly which keys
   * (if any) are actually reaching the app, independent of whether they're
   * bound to an action or being captured for one.
   */
  onRawKey?: (event: KeyEventPayload) => void;
};

export function usePedalInput({
  onAction,
  onDisconnectAlert,
  onConnectAlert,
  onRawKey,
}: Options = {}) {
  const [isPedalConnected, setIsPedalConnected] = useState(false);
  const [bindings, setBindingsState] = useState<KeyBinding[]>([]);
  const [alertOnDisconnect, setAlertOnDisconnectState] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);

  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;
  const captureResolverRef = useRef<((event: KeyEventPayload) => void) | null>(null);
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;
  const onDisconnectAlertRef = useRef(onDisconnectAlert);
  onDisconnectAlertRef.current = onDisconnectAlert;
  const onConnectAlertRef = useRef(onConnectAlert);
  onConnectAlertRef.current = onConnectAlert;
  const onRawKeyRef = useRef(onRawKey);
  onRawKeyRef.current = onRawKey;
  const alertOnDisconnectRef = useRef(alertOnDisconnect);
  alertOnDisconnectRef.current = alertOnDisconnect;

  useEffect(() => {
    (async () => {
      setBindingsState(await loadKeyBindings());
      setAlertOnDisconnectState(await loadAlertOnDisconnect());
      setIsPedalConnected(CuemePedalInput.isPedalConnected());
    })();
  }, []);

  useEffect(() => {
    const subs = [
      CuemePedalInput.addListener('onPedalConnected', () => {
        setIsPedalConnected(true);
        onConnectAlertRef.current?.();
      }),
      CuemePedalInput.addListener('onPedalDisconnected', () => {
        setIsPedalConnected(false);
        if (alertOnDisconnectRef.current) {
          onDisconnectAlertRef.current?.();
        }
      }),
      CuemePedalInput.addListener('onKeyEvent', (event: KeyEventPayload) => {
        if (!event.isKeyDown) {
          return;
        }
        onRawKeyRef.current?.(event);
        if (captureResolverRef.current) {
          const resolver = captureResolverRef.current;
          captureResolverRef.current = null;
          setIsCapturing(false);
          resolver(event);
          return;
        }
        const action = resolveAction(event.keyCode, bindingsRef.current);
        if (action) {
          onActionRef.current?.(action);
        }
      }),
    ];
    return () => subs.forEach((sub) => sub.remove());
  }, []);

  const assignBinding = useCallback((action: PedalAction, event: KeyEventPayload) => {
    setBindingsState((current) => {
      const next = setBinding(current, action, event.keyCode, event.keyName);
      void saveKeyBindings(next);
      return next;
    });
  }, []);

  /** Resolves with the next raw key press, for the Settings "press a button to assign" flow. */
  const captureNextKey = useCallback((): Promise<KeyEventPayload> => {
    // isPedalConnected() also re-attaches the native key handler as a side
    // effect — calling it here guarantees a fresh attachment right before
    // the moment it matters most, in case a pedal that was already
    // connected before this screen mounted never triggered the handler.
    CuemePedalInput.isPedalConnected();
    setIsCapturing(true);
    return new Promise((resolve) => {
      captureResolverRef.current = resolve;
    });
  }, []);

  const cancelCapture = useCallback(() => {
    captureResolverRef.current = null;
    setIsCapturing(false);
  }, []);

  const setAlertOnDisconnect = useCallback((value: boolean) => {
    setAlertOnDisconnectState(value);
    void saveAlertOnDisconnect(value);
  }, []);

  return {
    isPedalConnected,
    bindings,
    assignBinding,
    isCapturing,
    captureNextKey,
    cancelCapture,
    alertOnDisconnect,
    setAlertOnDisconnect,
  };
}
