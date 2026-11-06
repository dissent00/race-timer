import AppKit
// Usage: swift make-icons.swift   (writes icon-192.png and icon-512.png next to this file)
func draw(_ size: Int) -> Data {
  let s = CGFloat(size)
  let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size, bitsPerSample: 8,
    samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
  let ink = NSColor(red: 0.078, green: 0.086, blue: 0.059, alpha: 1)
  let brass = NSColor(red: 0.831, green: 0.651, blue: 0.235, alpha: 1)
  ink.setFill(); NSBezierPath(rect: NSRect(x: 0, y: 0, width: s, height: s)).fill()
  let c = NSPoint(x: s / 2, y: s * 0.46); let r = s * 0.30
  brass.setStroke()
  let ring = NSBezierPath(ovalIn: NSRect(x: c.x - r, y: c.y - r, width: r * 2, height: r * 2)); ring.lineWidth = s * 0.055; ring.stroke()
  let stem = NSBezierPath(rect: NSRect(x: c.x - s * 0.04, y: c.y + r + s * 0.02, width: s * 0.08, height: s * 0.07)); brass.setFill(); stem.fill()
  let hand = NSBezierPath(); hand.move(to: c); hand.line(to: NSPoint(x: c.x + r * 0.55, y: c.y + r * 0.55)); hand.lineWidth = s * 0.05; hand.lineCapStyle = .round; hand.stroke()
  NSGraphicsContext.restoreGraphicsState()
  return rep.representation(using: .png, properties: [:])!
}
let dir = URL(fileURLWithPath: CommandLine.arguments[0]).deletingLastPathComponent()
for n in [192, 512] { try! draw(n).write(to: dir.appendingPathComponent("icon-\(n).png")) }
