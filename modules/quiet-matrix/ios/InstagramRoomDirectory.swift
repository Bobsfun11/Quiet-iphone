import Foundation
import MatrixRustSDK

enum InstagramRoomDirectory {
    private static let eventTypes = ["m.bridge", "uk.half-shot.bridge"].map { stateEventTypeFromString(s: $0) }

    static func containsInstagramPortal(_ room: Room) async throws -> Bool {
        for type in eventTypes {
            let events = try await room.stateEvents(eventType: type)
            for event in events {
                guard let content = try? JSONDecoder().decode(BridgeContent.self, from: Data(event.contentJson.utf8)),
                      content.isInstagram(sender: event.sender) else { continue }
                return true
            }
        }
        return false
    }

    private struct BridgeContent: Decodable {
        let bridgebot: String?
        let `protocol`: BridgeProtocol?
        let channel: Channel?

        struct BridgeProtocol: Decodable { let id: String? }
        struct Channel: Decodable { let id: String? }

        func isInstagram(sender: String) -> Bool {
            guard let bot = bridgebot, sender == bot, let protocolId = `protocol`?.id,
                  let channelId = channel?.id, !channelId.isEmpty else { return false }
            let botName = bot.split(separator: ":", maxSplits: 1).first
            return (botName == "@instagramgobot" || botName == "@instagrambot")
                && (protocolId == "instagram" || protocolId == "instagramgo")
        }
    }
}
