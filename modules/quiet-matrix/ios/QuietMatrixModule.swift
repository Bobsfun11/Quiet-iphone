import ExpoModulesCore
import Foundation

public final class QuietMatrixModule: Module {
    private let inbox = InstagramInbox()
    private let tiktok = TikTokPassport()

    public func definition() -> ModuleDefinition {
        Name("QuietMatrix")

        AsyncFunction("sessionStatus") { () async throws -> AccountStatus in
            try await self.inbox.status()
        }
        AsyncFunction("signIn") { (username: String, password: String) async throws -> AccountStatus in
            try await self.inbox.signIn(username: username, password: password)
        }
        AsyncFunction("verify") { (recoveryKey: String) async throws -> AccountStatus in
            try await self.inbox.verify(recoveryKey: recoveryKey)
        }
        AsyncFunction("signOut") { () async throws in
            try await self.inbox.signOut()
        }
        AsyncFunction("listChats") { () async throws -> InboxListResult in
            var result = InboxListResult()
            do {
                result.chats = try await self.inbox.listChats()
            } catch let error as InboxError {
                result.loading = error == .loading
                if !result.loading { result.errorMessage = error.localizedDescription }
            }
            return result
        }
        AsyncFunction("listMessages") { (roomId: String) async throws -> [InboxMessageRecord] in
            try await self.inbox.listMessages(roomId: roomId)
        }
        AsyncFunction("sendMessage") { (roomId: String, text: String) async throws -> InboxMessageRecord in
            try await self.inbox.sendMessage(roomId: roomId, text: text)
        }
        AsyncFunction("openTikTokAttempt") { () async -> TikTokAttemptRecord in
            await self.tiktok.open()
        }
        AsyncFunction("closeTikTokAttempt") { (id: String) async in
            await self.tiktok.close(id: id)
        }
        AsyncFunction("tiktokRandomWords") { () async throws -> [Int] in
            try await self.tiktok.randomWords()
        }
        AsyncFunction("tiktokPassportRequest") { (id: String, url: String, userAgent: String, ticket: String?) async throws -> String in
            try await self.tiktok.request(id: id, url: url, userAgent: userAgent, migrationTicket: ticket)
        }
        AsyncFunction("tiktokInboxRequest") { (id: String, payload: String, history: Bool) async throws -> String in
            try await self.tiktok.inbox(id: id, payload: payload, history: history)
        }
        AsyncFunction("tiktokProfile") { (id: String) async throws -> TikTokProfileRecord in
            try await self.tiktok.profile(id: id)
        }
    }
}

struct TikTokAttemptRecord: Record {
    @Field var id: String = ""
    @Field var deviceId: String = ""
    @Field var verificationId: String = ""
    @Field var region: String = ""
    @Field var language: String = ""
    @Field var timeZone: String = ""
}

struct TikTokProfileRecord: Record {
    @Field var userId: String = ""
    @Field var deviceId: String?
}

struct AccountStatus: Record {
    @Field var state: String = "signedOut"
    @Field var userId: String?

    init() {}

    init(_ state: String, userId: String? = nil) {
        self.state = state
        self.userId = userId
    }
}

struct InboxChatRecord: Record {
    @Field var id: String = ""
    @Field var title: String = ""
    @Field var preview: String = ""
    @Field var updatedAt: String = ""
    @Field var unread: Bool = false
}

struct InboxListResult: Record {
    @Field var chats: [InboxChatRecord] = []
    @Field var loading = false
    @Field var errorMessage: String?
}

struct InboxMessageRecord: Record {
    @Field var id: String = ""
    @Field var text: String = ""
    @Field var sentAt: String = ""
    @Field var outgoing: Bool = false
    @Field var senderName: String?
}
