import ExpoModulesCore
import Foundation

public final class QuietMatrixModule: Module {
    private let inbox = InstagramInbox()

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
        AsyncFunction("listChats") { () async throws -> [InboxChatRecord] in
            do {
                return try await self.inbox.listChats()
            } catch let error as InboxError {
                let code = error == .loading ? "QUIET_INBOX_LOADING" : "QUIET_INBOX_SYNC"
                throw Exception(name: "InstagramInbox", description: error.localizedDescription, code: code)
            }
        }
        AsyncFunction("listMessages") { (roomId: String) async throws -> [InboxMessageRecord] in
            try await self.inbox.listMessages(roomId: roomId)
        }
        AsyncFunction("sendMessage") { (roomId: String, text: String) async throws -> InboxMessageRecord in
            try await self.inbox.sendMessage(roomId: roomId, text: text)
        }
    }
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

struct InboxMessageRecord: Record {
    @Field var id: String = ""
    @Field var text: String = ""
    @Field var sentAt: String = ""
    @Field var outgoing: Bool = false
    @Field var senderName: String?
}
