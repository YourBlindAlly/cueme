export type KeyEventPayload = {
  keyCode: number;
  keyName: string;
  isKeyDown: boolean;
};

export type AudioInterruptionEndedPayload = {
  /** Whether iOS reports it's safe/expected to resume audio (see AVAudioSessionInterruptionOptionShouldResume). */
  shouldResume: boolean;
};

export type CuemePedalInputEvents = {
  onPedalConnected: () => void;
  onPedalDisconnected: () => void;
  onKeyEvent: (event: KeyEventPayload) => void;
  onAudioInterruptionEnded: (event: AudioInterruptionEndedPayload) => void;
};
