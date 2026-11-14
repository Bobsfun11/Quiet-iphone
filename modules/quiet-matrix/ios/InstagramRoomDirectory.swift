import Foundation

enum InstagramRoomDirectory {
    private static let eventTypes = ["m.bridge", "uk.half-shot.bridge"]

    private struct SyncResponse: Decodable {
        let rooms: Rooms?

        struct Rooms: Decodable {
            let join: [String: JoinedRoom]?
        }

        struct JoinedRoom: Decodable {
            let state: RoomState?
        }

        struct RoomState: Decodable {
            let events: [BridgeEvent]
        }
    }

    private struct BridgeEvent: Decodable {
        let sender: String?
        let content: Content?

        struct Content: Decodable {
            let bridgebot: String?
            let `protocol`: BridgeProtocol?
            let channel: Channel?

            struct BridgeProtocol: Decodable { let id: String? }
            struct Channel: Decodable { let id: String? }
        }

        var isInstagram: Bool {
            guard let content, let bot = content.bridgebot, let protocolId = content.protocol?.id,
                  let channelId = content.channel?.id, !channelId.isEmpty, sender == bot else { return false }
            let botName = bot.split(separator: ":", maxSplits: 1).first
            return (botName == "@instagramgobot" || botName == "@instagrambot")
                && (protocolId == "instagram" || protocolId == "instagramgo")
        }
    }

    static func joinedRooms(accessToken: String) async throws -> Set<String> {
        let filter: [String: Any] = [
            "presence": ["types": []],
            "account_data": ["types": []],
            "room": ["state": ["types": eventTypes], "timeline": ["limit": 0, "types": []],
                     "ephemeral": ["types": []], "account_data": ["types": []]],
        ]
        let encoded = try JSONSerialization.data(withJSONObject: filter)
        var url = URLComponents()
        url.scheme = "https"
        url.host = "matrix.beeper.com"
        url.path = "/_matrix/client/v3/sync"
        url.queryItems = [URLQueryItem(name: "filter", value: String(decoding: encoded, as: UTF8.self)),
                          URLQueryItem(name: "timeout", value: "0"), URLQueryItem(name: "set_presence", value: "offline")]
        guard let endpoint = url.url else { throw InboxError.network }
        var request = URLRequest(url: endpoint, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 20)
        request.setValue("Bearer " + accessToken, forHTTPHeaderField: "Authorization")
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200, http.url?.host == "matrix.beeper.com" else {
            throw InboxError.network
        }
        let rooms = try JSONDecoder().decode(SyncResponse.self, from: data).rooms?.join ?? [:]
        return Set(rooms.compactMap { id, room in room.state?.events.contains(where: \.isInstagram) == true ? id : nil })
    }
}
