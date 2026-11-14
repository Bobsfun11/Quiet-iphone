import Foundation
import MatrixRustSDK

final class TimelineSnapshot: TimelineListener, @unchecked Sendable {
    private let lock = NSLock()
    private var items: [TimelineItem] = []

    func onUpdate(diff: [TimelineDiff]) {
        lock.lock()
        defer { lock.unlock() }
        for change in diff {
            switch change {
            case let .append(values): items.append(contentsOf: values)
            case .clear: items.removeAll()
            case let .pushFront(value): items.insert(value, at: 0)
            case let .pushBack(value): items.append(value)
            case .popFront: if !items.isEmpty { items.removeFirst() }
            case .popBack: if !items.isEmpty { items.removeLast() }
            case let .insert(index, value): if index <= items.count { items.insert(value, at: Int(index)) }
            case let .set(index, value): if index < items.count { items[Int(index)] = value }
            case let .remove(index): if index < items.count { items.remove(at: Int(index)) }
            case let .truncate(length): if length < items.count { items.removeLast(items.count - Int(length)) }
            case let .reset(values): items = values
            }
        }
    }

    func events() -> [EventTimelineItem] {
        lock.lock()
        let snapshot = items
        lock.unlock()
        return snapshot.compactMap { $0.asEvent() }
    }
}
