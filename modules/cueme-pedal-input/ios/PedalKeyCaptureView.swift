import ExpoModulesCore
import UIKit

/// An invisible view that becomes first responder purely to receive raw
/// hardware key presses through UIKit's classic `pressesBegan`/`pressesEnded`
/// responder-chain mechanism — the same lower-level path apps like ForScore
/// have relied on for Bluetooth page-turn pedals since long before Apple's
/// newer GameController framework (GCKeyboard, used elsewhere in this module)
/// existed.
///
/// Added after real-device testing showed GCKeyboard never delivers a single
/// key event from a specific page-turn pedal, in any of its modes, even with
/// VoiceOver fully off, Full Keyboard Access off, and a completely fresh app
/// process — while that same pedal's Enter key reached a plain iOS text
/// field, proving this lower-level path genuinely receives its input.
class PedalKeyCaptureView: ExpoView {
  override var canBecomeFirstResponder: Bool { true }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    isUserInteractionEnabled = false
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window != nil {
      becomeFirstResponder()
    }
  }

  override func pressesBegan(_ presses: Set<UIPress>, with event: UIPressesEvent?) {
    handle(presses, isKeyDown: true)
    super.pressesBegan(presses, with: event)
  }

  override func pressesEnded(_ presses: Set<UIPress>, with event: UIPressesEvent?) {
    handle(presses, isKeyDown: false)
    super.pressesEnded(presses, with: event)
  }

  private func handle(_ presses: Set<UIPress>, isKeyDown: Bool) {
    for press in presses {
      guard let key = press.key else { continue }
      let rawCode = Int(key.keyCode.rawValue)
      CuemePedalInputModule.current?.emitKeyEvent(
        keyCode: rawCode,
        keyName: PedalKeyCaptureView.keyName(forRawHIDUsage: rawCode),
        isKeyDown: isKeyDown
      )
    }
  }

  /// Best-effort display names for common page-turn-pedal keys — purely
  /// cosmetic. Binding/matching in JS is done by the numeric HID usage code
  /// (see keyBindings.ts's HID_USAGE constants, which use the same numbering),
  /// so an unrecognized code here still works correctly, just with a generic
  /// "Key <n>" label instead of a friendly name.
  private static func keyName(forRawHIDUsage code: Int) -> String {
    switch code {
    case 0x4F: return "Right Arrow"
    case 0x50: return "Left Arrow"
    case 0x51: return "Down Arrow"
    case 0x52: return "Up Arrow"
    case 0x4B: return "Page Up"
    case 0x4E: return "Page Down"
    case 0x2C: return "Spacebar"
    case 0x2B: return "Tab"
    case 0x28: return "Enter"
    case 0x29: return "Escape"
    case 0x4A: return "Home"
    case 0x4D: return "End"
    default: return "Key \(code)"
    }
  }
}
