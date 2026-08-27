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
  private var connectObserver: NSObjectProtocol?
  private var disconnectObserver: NSObjectProtocol?
  private var interruptionObserver: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("CuemePedalInput")

    Events("onPedalConnected", "onPedalDisconnected", "onKeyEvent", "onAudioInterruptionEnded")

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
        let body: [String: Any?] = [:]
        self.sendEvent("onPedalDisconnected", body)
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
