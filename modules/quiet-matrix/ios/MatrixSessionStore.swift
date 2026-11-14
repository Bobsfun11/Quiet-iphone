import Foundation
import MatrixRustSDK
import Security

struct MatrixSessionStore {
    private let service = "com.quietsocial.personal.beeper"

    struct SavedSession: Codable {
        let accessToken: String
        let refreshToken: String?
        let userId: String
        let deviceId: String
        let storeDirectory: UUID
        let storeKey: Data

        init(session: Session, storeDirectory: UUID, storeKey: Data) {
            accessToken = session.accessToken
            refreshToken = session.refreshToken
            userId = session.userId
            deviceId = session.deviceId
            self.storeDirectory = storeDirectory
            self.storeKey = storeKey
        }

        func session(homeserver: String) -> Session {
            Session(accessToken: accessToken, refreshToken: refreshToken, userId: userId,
                    deviceId: deviceId, homeserverUrl: homeserver, oauthData: nil, slidingSyncVersion: .native)
        }
    }

    func load() throws -> SavedSession? {
        var query = attributes
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess, let data = item as? Data else { throw InboxError.storage }
        return try JSONDecoder().decode(SavedSession.self, from: data)
    }

    func save(_ session: SavedSession) throws {
        let data = try JSONEncoder().encode(session)
        let update = [kSecValueData as String: data]
        let status = SecItemUpdate(attributes as CFDictionary, update as CFDictionary)
        if status == errSecSuccess { return }
        guard status == errSecItemNotFound else { throw InboxError.storage }
        var query = attributes
        query[kSecValueData as String] = data
        query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        guard SecItemAdd(query as CFDictionary, nil) == errSecSuccess else { throw InboxError.storage }
    }

    func clear() throws {
        let status = SecItemDelete(attributes as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else { throw InboxError.storage }
    }

    func newStoreKey() throws -> Data {
        var bytes = [UInt8](repeating: 0, count: 32)
        let status = bytes.withUnsafeMutableBytes { buffer in
            SecRandomCopyBytes(kSecRandomDefault, buffer.count, buffer.baseAddress!)
        }
        guard status == errSecSuccess else { throw InboxError.storage }
        return Data(bytes)
    }

    private var attributes: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service,
         kSecAttrAccount as String: "session"]
    }
}

enum InboxError: LocalizedError {
    case storage, busy, signIn, verify, room, network, invalidMessage

    var errorDescription: String? {
        switch self {
        case .storage: return "Quiet couldn’t access its secure storage."
        case .busy: return "An account operation is running."
        case .signIn: return "Sign in to Beeper to continue."
        case .verify: return "Verify this device with your Beeper recovery code."
        case .room: return "This Instagram conversation is unavailable."
        case .network: return "Quiet couldn’t reach Beeper."
        case .invalidMessage: return "Enter a message of up to 2000 characters."
        }
    }
}
