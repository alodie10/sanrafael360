import AppKit

final class Delegate: NSObject, NSApplicationDelegate {
    private var handled = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            if self?.handled != true {
                NSApp.terminate(nil)
            }
        }
    }

    func application(_ application: NSApplication, open urls: [URL]) {
        handled = true
        for url in urls {
            openDraft(url)
        }
        NSApp.terminate(nil)
    }
}

private func openDraft(_ url: URL) {
    guard let script = Bundle.main.resourceURL?.appendingPathComponent("abrir.py") else { return }
    let task = Process()
    task.executableURL = URL(fileURLWithPath: "/usr/bin/python3")
    task.arguments = [script.path, url.absoluteString]
    try? task.run()
    task.waitUntilExit()
}

let app = NSApplication.shared
let delegate = Delegate()
app.delegate = delegate
app.setActivationPolicy(.accessory)
app.run()
