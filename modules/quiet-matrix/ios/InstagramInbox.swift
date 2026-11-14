import Foundation
import MatrixRustSDK
import os

actor InstagramInbox {
    private static let homeserver = "https://matrix.beeper.com"
    private let store = MatrixSessionStore()
    private let dateFormatter = ISO8601DateFormatter()
    private var client: Client?
    private static let logger = Logger(subsystem: "com.quietsocial.personal", category: "InstagramSync")
    private var sync: Task<Void, Never>?
    private var changingAccount = false
    private var roomIds: Set<String> = []
    private var needsRoomScan = true
    private var hasSynced = false
    private var syncFailed = false
    private var activeThread: ActiveThread?

    private struct ActiveThread {
        let roomId: String
        let timeline: Timeline
        let snapshot: TimelineSnapshot
        let listener: TaskHandle
    }

    func status() async throws -> AccountStatus {
        if changingAccount { throw InboxError.busy }
        if let client { return try accountStatus(client) }
        guard let saved = try store.load() else { return AccountStatus("signedOut") }

        changingAccount = true
        defer { changingAccount = false }
        let restored = try await buildClient(directory: saved.storeDirectory, key: saved.storeKey)
        try await restored.restoreSession(session: saved.session(homeserver: Self.homeserver))
        start(restored)
        return try accountStatus(restored)
    }

    func signIn(username: String, password: String) async throws -> AccountStatus {
        guard !changingAccount, client == nil else { throw InboxError.busy }
        guard try store.load() == nil else { return try await status() }

        changingAccount = true
        defer { changingAccount = false }
        let directory = UUID()
        let key = try store.newStoreKey()
        do {
            let next = try await buildClient(directory: directory, key: key)
            if username.contains("@") && !username.hasPrefix("@") {
                try await next.loginWithEmail(email: username, password: password, initialDeviceName: "Quiet for iPhone", deviceId: nil)
            } else {
                try await next.login(username: username, password: password, initialDeviceName: "Quiet for iPhone", deviceId: nil)
            }
            do {
                start(next)
                try store.save(.init(session: next.session(), storeDirectory: directory, storeKey: key))
                return try accountStatus(next)
            } catch {
                sync?.cancel()
                sync = nil
                client = nil
                try? await next.logout()
                throw error
            }
        } catch {
            try? FileManager.default.removeItem(at: storeURL(directory))
            throw error
        }
    }

    func verify(recoveryKey: String) async throws -> AccountStatus {
        guard !changingAccount, let client else { throw InboxError.signIn }
        changingAccount = true
        defer { changingAccount = false }
        try await client.encryption().recover(recoveryKey: recoveryKey)
        await client.encryption().waitForE2eeInitializationTasks()
        let result = try accountStatus(client)
        guard result.state == "ready" else { throw InboxError.verify }
        return result
    }

    func signOut() async throws {
        guard !changingAccount else { throw InboxError.busy }
        changingAccount = true
        defer { changingAccount = false }
        let saved = try store.load()
        try store.clear()

        let previous = client
        client = nil
        resetThread()
        roomIds.removeAll()
        needsRoomScan = true
        hasSynced = false
        syncFailed = false
        sync?.cancel()
        sync = nil
        if let previous { try? await previous.logout() }
        if let saved { try? FileManager.default.removeItem(at: storeURL(saved.storeDirectory)) }
    }

    func listChats() async throws -> [InboxChatRecord] {
        let client = try readyClient()
        guard hasSynced else { throw syncFailed ? InboxError.sync : InboxError.loading }
        try await refreshRoomIds(client)
        let visibleRooms = roomIds
        var results: [InboxChatRecord] = []
        for room in client.rooms() where visibleRooms.contains(room.id()) && room.membership() == .joined && !room.isSpace() {
            guard let info = try? await room.roomInfo(), await room.isEncrypted() else { continue }
            var record = InboxChatRecord()
            record.id = room.id()
            record.title = info.displayName ?? "Instagram conversation"
            record.unread = info.isMarkedUnread || info.numUnreadMessages > 0
            switch await room.latestEvent() {
            case let .remote(timestamp, _, _, _, content), let .local(timestamp, _, _, content, _):
                record.updatedAt = date(timestamp)
                record.preview = text(for: content) ?? "Conversation"
            default: break
            }
            results.append(record)
        }
        guard self.client === client else { throw InboxError.signIn }
        return results
    }

    func listMessages(roomId: String) async throws -> [InboxMessageRecord] {
        let client = try readyClient()
        let room = try await allowedRoom(roomId, client: client)
        if activeThread?.roomId != roomId {
            let timeline = try await room.timeline()
            let snapshot = TimelineSnapshot()
            let listener = await timeline.addListener(listener: snapshot)
            guard self.client === client else {
                listener.cancel()
                throw InboxError.signIn
            }
            resetThread()
            activeThread = ActiveThread(roomId: roomId, timeline: timeline, snapshot: snapshot, listener: listener)
            _ = try? await timeline.paginateBackwards(numEvents: 40)
        }
        guard self.client === client, let thread = activeThread, thread.roomId == roomId else { throw InboxError.room }
        let events = thread.snapshot.events()
        if events.contains(where: { !$0.isOwn && $0.isRemote }) {
            try? await thread.timeline.markAsRead(receiptType: .readPrivate)
        }
        guard self.client === client else { throw InboxError.signIn }
        return events.compactMap(messageRecord)
    }

    func sendMessage(roomId: String, text body: String) async throws -> InboxMessageRecord {
        let client = try readyClient()
        guard !body.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, body.utf16.count <= 2000 else {
            throw InboxError.invalidMessage
        }
        let room = try await allowedRoom(roomId, client: client)
        let payload = try JSONEncoder().encode(["msgtype": "m.text", "body": body])
        let eventId = try await room.sendRaw(eventType: "m.room.message", content: String(decoding: payload, as: UTF8.self),
            requestConfigOverride: .init(retryLimit: 0, timeout: 20_000))
        var record = InboxMessageRecord()
        record.id = eventId
        record.text = body
        record.sentAt = dateFormatter.string(from: Date())
        record.outgoing = true
        return record
    }

    private func accountStatus(_ client: Client) throws -> AccountStatus {
        AccountStatus(client.encryption().verificationState() == .verified ? "ready" : "verificationRequired",
                      userId: try client.userId())
    }

    private func readyClient() throws -> Client {
        guard !changingAccount, let client else { throw InboxError.signIn }
        guard client.encryption().verificationState() == .verified else { throw InboxError.verify }
        return client
    }

    private func buildClient(directory: UUID, key: Data) async throws -> Client {
        let root = try storeURL(directory)
        let data = root.appendingPathComponent("data", isDirectory: true)
        let cache = root.appendingPathComponent("cache", isDirectory: true)
        try FileManager.default.createDirectory(at: data, withIntermediateDirectories: true)
        try FileManager.default.createDirectory(at: cache, withIntermediateDirectories: true)
        var protectedRoot = root
        var properties = URLResourceValues()
        properties.isExcludedFromBackup = true
        try protectedRoot.setResourceValues(properties)
        let sqlite = SqliteStoreBuilder(dataPath: data.path, cachePath: cache.path).key(key: key)
        return try await ClientBuilder().homeserverUrl(url: Self.homeserver).disableWellKnownLookup(disableWellKnownLookup: true)
            .sqliteStore(config: sqlite).slidingSyncVersionBuilder(versionBuilder: .native)
            .backupDownloadStrategy(backupDownloadStrategy: .afterDecryptionFailure)
            .autoEnableBackups(autoEnableBackups: false).autoEnableCrossSigning(autoEnableCrossSigning: false)
            .requestConfig(config: .init(retryLimit: 1, timeout: 30_000, maxConcurrentRequests: 6, maxRetryTime: nil)).build()
    }

    private func storeURL(_ directory: UUID) throws -> URL {
        try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            .appendingPathComponent("QuietInstagram", isDirectory: true).appendingPathComponent(directory.uuidString, isDirectory: true)
    }

    private func start(_ client: Client) {
        self.client = client
        sync = Task.detached { [weak self] in
            // Beeper's classic sync includes cloud bridge rooms that are absent from sliding sync.
            var failures = 0
            while !Task.isCancelled {
                do {
                    let response = try await client.syncOnceV2(settings: .init(timeoutMs: 20_000))
                    guard !Task.isCancelled else { return }
                    await self?.didSync(client, changedRooms: !response.rooms.joined.isEmpty || !response.rooms.left.isEmpty)
                    failures = 0
                } catch {
                    guard !Task.isCancelled else { return }
                    let code: String
                    if let clientError = error as? ClientError,
                       case let .MatrixApi(_, matrixCode, _, _) = clientError,
                       matrixCode.range(of: "^M_[A-Z_]{1,40}$", options: .regularExpression) != nil {
                        code = matrixCode
                    } else {
                        code = ""
                    }
                    await self?.didFailSync(client, code: code)
                    failures = min(failures + 1, 5)
                    try? await Task.sleep(for: .seconds(failures * 2))
                }
            }
        }
    }

    private func didSync(_ client: Client, changedRooms: Bool) {
        guard self.client === client else { return }
        if !hasSynced {
            Self.logger.notice("Beeper initial sync finished")
        }
        hasSynced = true
        syncFailed = false
        needsRoomScan = needsRoomScan || changedRooms
    }

    private func didFailSync(_ client: Client, code: String) {
        guard self.client === client, !syncFailed else { return }
        syncFailed = true
        Self.logger.error("Beeper sync request failed \(code, privacy: .public)")
    }

    private func resetThread() {
        activeThread?.listener.cancel()
        activeThread = nil
    }

    private func allowedRoom(_ id: String, client: Client) async throws -> Room {
        try await refreshRoomIds(client)
        guard roomIds.contains(id), let room = try client.getRoom(roomId: id), room.membership() == .joined,
              !room.isSpace(), try await InstagramRoomDirectory.containsInstagramPortal(room),
              await room.isEncrypted(), self.client === client else { throw InboxError.room }
        return room
    }

    private func refreshRoomIds(_ client: Client) async throws {
        guard needsRoomScan else { return }
        needsRoomScan = false
        var ids: Set<String> = []
        do {
            for room in client.rooms() where room.membership() == .joined && !room.isSpace() {
                if try await InstagramRoomDirectory.containsInstagramPortal(room) {
                    ids.insert(room.id())
                }
            }
        } catch {
            if self.client === client { needsRoomScan = true }
            throw InboxError.roomDirectory
        }
        guard self.client === client else { throw InboxError.signIn }
        roomIds = ids
    }

    private func date(_ timestamp: UInt64) -> String {
        dateFormatter.string(from: Date(timeIntervalSince1970: Double(timestamp) / 1000))
    }

    private func text(for item: TimelineItemContent) -> String? {
        guard case let .msgLike(content) = item else { return nil }
        switch content.kind {
        case let .message(message):
            switch message.msgType {
            case .text, .emote, .notice: return message.body
            case .image: return "Photo"
            case .video: return "Video"
            case .audio: return "Audio message"
            default: return "Attachment"
            }
        case .sticker: return "Sticker"
        case .unableToDecrypt: return "Waiting for message keys"
        default: return nil
        }
    }

    private func messageRecord(_ item: EventTimelineItem) -> InboxMessageRecord? {
        guard case let .eventId(id) = item.eventOrTransactionId, let body = text(for: item.content) else { return nil }
        var record = InboxMessageRecord()
        record.id = id
        record.text = body
        record.sentAt = date(item.timestamp)
        record.outgoing = item.isOwn
        if case let .ready(name, _, _, _, _) = item.senderProfile { record.senderName = name }
        return record
    }
}
