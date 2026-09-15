import ExpoModulesCore
import GameController
import AVFoundation

/// CueMe's native iOS integration bridge. Started as pedal-input-only (hence
/// the module name) but also covers audio-session interruption notifications
/// (phone calls, etc.) since neither expo-speech nor expo-audio expose that
/// at the JS layer — both are small, iOS-only concerns better kept in one
/// module than as two near-empty ones.
///
/// Pedal input: bridges Apple's GameController framework (GCKeyboard) to JS
/// so CueMe can react to hardware key presses from a Bluetooth page-turn
/// pedal (which presents itself to iOS as an HID keyboard) app-wide, not
/// just when a text field is focused — and so it can detect the pedal
/// connecting/disconnecting, which UIKit's UIKeyCommand APIs don't expose.
public class CuemePedalInputModule: Module {
  /// Weak reference used by PedalKeyCaptureView to reach this module's
  /// sendEvent — simpler and more robust than looking the module instance
  /// back up through Expo's module registry from the view.
  static weak var current: CuemePedalInputModule?

  private var connectObserver: NSObjectProtocol?
  private var disconnectObserver: NSObjectProtocol?
  private var interruptionObserver: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("CuemePedalInput")

    OnCreate {
      CuemePedalInputModule.current = self
    }

    Events("onPedalConnected", "onPedalDisconnected", "onKeyEvent", "onAudioInterruptionEnded")

    View(PedalKeyCaptureView.self) { }

    OnStartObserving {
      self.attachKeyHandler(to: GCKeyboard.coalesced?.keyboardInput)

      self.connectObserver = NotificationCenter.default.addObserver(
        forName: .GCKeyboardDidConnect,
        object: nil,
        queue: .main
      ) { [weak self] notification in
        guard let self else { return }
        let keyboard = notification.object as? GCKeyboard
        self.attachKeyHandler(to: keyboard?.keyboardInput)
        let body: [String: Any?] = [:]
        self.sendEvent("onPedalConnected", body)
      }

      self.disconnectObserver = NotificationCenter.default.addObserver(
        forName: .GCKeyboardDidDisconnect,
        object: nil,
        queue: .main
      ) { [weak self] _ in
        guard let self else { return }
        // Debounced, not immediate — a real pedal disconnect (power off,
        // walking out of range) stays disconnected well past this delay, so
        // this adds no perceptible lag there. But a momentary Bluetooth
        // signal blip can fire this same notification without the pedal
        // actually going away, reported 2026-09-15 as the UI briefly
        // showing "disconnected" while presses kept working fine the whole
        // time — re-checking GCKeyboard.coalesced after a short delay
        // filters that case out instead of trusting the notification alone.
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
          guard let self else { return }
          if GCKeyboard.coalesced == nil {
            let body: [String: Any?] = [:]
            self.sendEvent("onPedalDisconnected", body)
          }
        }
      }

      self.interruptionObserver = NotificationCenter.default.addObserver(
        forName: AVAudioSession.interruptionNotification,
        object: nil,
        queue: .main
      ) { [weak self] notification in
        guard let self else { return }
        guard
          let info = notification.userInfo,
          let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
          let type = AVAudioSession.InterruptionType(rawValue: typeValue),
          type == .ended
        else { return }

        var shouldResume = false
        if let optionsValue = info[AVAudioSessionInterruptionOptionKey] as? UInt {
          shouldResume = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
            .contains(.shouldResume)
        }
        let body: [String: Any?] = ["shouldResume": shouldResume]
        self.sendEvent("onAudioInterruptionEnded", body)
      }
    }

    OnStopObserving {
      if let observer = self.connectObserver {
        NotificationCenter.default.removeObserver(observer)
        self.connectObserver = nil
      }
      if let observer = self.disconnectObserver {
        NotificationCenter.default.removeObserver(observer)
        self.disconnectObserver = nil
      }
      if let observer = self.interruptionObserver {
        NotificationCenter.default.removeObserver(observer)
        self.interruptionObserver = nil
      }
      GCKeyboard.coalesced?.keyboardInput?.keyChangedHandler = nil
    }

    Function("isPedalConnected") { () -> Bool in
      // Re-attaching here (not just in OnStartObserving/the connect
      // notification) is a self-healing safety net: if a keyboard was
      // already connected before this module started observing, the
      // "did connect" notification never fires for it (notifications are
      // edge-triggered), and if GCKeyboard.coalesced happened to be nil at
      // the exact moment OnStartObserving ran, the handler would never get
      // attached at all even though later connection checks correctly
      // report true. Re-attaching on every check closes that gap.
      let keyboard = GCKeyboard.coalesced
      self.attachKeyHandler(to: keyboard?.keyboardInput)
      return keyboard != nil
    }

    // Found 2026-09-15: the real key-delivery path (PedalKeyCaptureView's
    // pressesBegan/pressesEnded, see its own doc comment) only ever claims
    // first-responder status once, when the app launches. Any text field
    // anywhere in the app taking focus for typing — Search, the paste-a-
    // song box, a setlist name field — silently steals that status away and
    // nothing gives it back on its own. The pedal's actual Bluetooth
    // connection never drops when this happens, so isPedalConnected()/the
    // connect-disconnect notifications above stay oblivious: the UI keeps
    // saying "Connected" while presses silently stop reaching the app,
    // until the pedal is physically power-cycled and its real Bluetooth
    // disconnect finally fires — which looks like it explains the problem
    // but doesn't, it's just the first real event that happens to follow
    // it. Call this from JS whenever the app returns to a place pedal
    // input actually matters (the Prompt screen gaining focus, the app
    // returning to the foreground) to reclaim it.
    Function("reclaimPedalFocus") { () in
      PedalKeyCaptureView.current?.reclaimFirstResponder()
    }
  }

  /// Called by PedalKeyCaptureView's pressesBegan/pressesEnded — the fallback
  /// key-delivery path that actually works for the pedal this was written
  /// against, unlike GCKeyboard's keyChangedHandler below.
  func emitKeyEvent(keyCode: Int, keyName: String, isKeyDown: Bool) {
    let body: [String: Any?] = [
      "keyCode": keyCode,
      "keyName": keyName,
      "isKeyDown": isKeyDown,
    ]
    sendEvent("onKeyEvent", body)
  }

  private func attachKeyHandler(to keyboardInput: GCKeyboardInput?) {
    keyboardInput?.keyChangedHandler = { [weak self] _, _, keyCode, pressed in
      guard let self else { return }
      let body: [String: Any?] = [
        "keyCode": keyCode.rawValue,
        "keyName": CuemePedalInputModule.keyName(for: keyCode),
        "isKeyDown": pressed,
      ]
      self.sendEvent("onKeyEvent", body)
    }
  }

  /// Friendly names for the keys page-turn pedals commonly send, for display
  /// in the remap UI. Unrecognized keys still work — they just show their
  /// raw code — since pedal models vary in exactly which key they emulate.
  private static func keyName(for keyCode: GCKeyCode) -> String {
    switch keyCode {
    case .rightArrow: return "Right Arrow"
    case .leftArrow: return "Left Arrow"
    case .upArrow: return "Up Arrow"
    case .downArrow: return "Down Arrow"
    case .pageUp: return "Page Up"
    case .pageDown: return "Page Down"
    case .spacebar: return "Spacebar"
    case .tab: return "Tab"
    case .returnOrEnter: return "Enter"
    case .escape: return "Escape"
    case .home: return "Home"
    case .end: return "End"
    default: return "Key \(keyCode.rawValue)"
    }
  }
}
