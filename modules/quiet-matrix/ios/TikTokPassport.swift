import Foundation
import Security
import os

actor TikTokPassport {
    private static let origin = URL(string: "https://www.tiktok.com")!
    private static let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
    private var attempt: Attempt?

    private struct Attempt {
        let id: String
        let session: URLSession
    }

    private final class PassportDelegate: NSObject, URLSessionTaskDelegate {
        func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                        newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
            completionHandler(nil)
        }
    }

    func open() -> TikTokAttemptRecord {
        attempt?.session.invalidateAndCancel()
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 12
        config.timeoutIntervalForResource = 20
        let session = URLSession(configuration: config, delegate: PassportDelegate(), delegateQueue: nil)
        let id = UUID().uuidString
        attempt = Attempt(id: id, session: session)
        var record = TikTokAttemptRecord()
        record.id = id
        record.deviceId = String(UInt64.random(in: 7_000_000_000_000_000_000..<8_000_000_000_000_000_000))
        let characters = Array("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")
        record.verificationId = "verify_" + [8, 8, 4, 4, 4, 12].map { count in
            String((0..<count).map { _ in characters[Int.random(in: 0..<characters.count)] })
        }.joined(separator: "_")
        record.region = Locale.current.region?.identifier ?? ""
        record.language = Locale.preferredLanguages.first ?? "en"
        record.timeZone = TimeZone.current.identifier
        return record
    }

    func close(id: String) {
        guard attempt?.id == id else { return }
        attempt?.session.invalidateAndCancel()
        attempt = nil
    }

    func randomWords() throws -> [Int] {
        var words = [UInt32](repeating: 0, count: 12)
        let result = words.withUnsafeMutableBytes { bytes in
            SecRandomCopyBytes(kSecRandomDefault, bytes.count, bytes.baseAddress!)
        }
        guard result == errSecSuccess else { throw PassportError.connection }
        return words.map { Int($0) }
    }

    func request(id: String, url: String, userAgent: String, migrationTicket: String?) async throws -> String {
        guard let attempt, attempt.id == id, let components = URLComponents(string: url), let url = components.url,
              components.scheme == "https", components.host == "www.tiktok.com", components.port == nil,
              components.user == nil, components.password == nil, components.fragment == nil,
              ["/passport/web/get_qrcode/", "/passport/web/check_qrconnect/"].contains(components.percentEncodedPath) else {
            throw PassportError.connection
        }

        if components.percentEncodedPath == "/passport/web/get_qrcode/" {
            var bootstrap = URLRequest(url: URL(string: "https://www.tiktok.com/login/qrcode")!)
            bootstrap.setValue(userAgent, forHTTPHeaderField: "User-Agent")
            let (_, response) = try await attempt.session.data(for: bootstrap)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw PassportError.connection }
        }

        var request = URLRequest(url: url)
        request.setValue(userAgent, forHTTPHeaderField: "User-Agent")
        request.setValue("https://www.tiktok.com/login/qrcode", forHTTPHeaderField: "Referer")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let migrationTicket {
            request.setValue(migrationTicket, forHTTPHeaderField: "x-tt-passport-ttwid-ticket")
        }
        let (data, response) = try await attempt.session.data(for: request)
        guard self.attempt?.id == id, (response as? HTTPURLResponse)?.statusCode == 200,
              data.count < 100_000, let json = String(data: data, encoding: .utf8) else {
            throw PassportError.connection
        }
        return json
    }

    func profile(id: String) async throws -> TikTokProfileRecord {
        let attempt = try authenticatedAttempt(id)
        var request = URLRequest(url: Self.origin.appendingPathComponent("messages"))
        request.setValue(Self.userAgent, forHTTPHeaderField: "User-Agent")
        let (data, response) = try await attempt.session.data(for: request)
        guard self.attempt?.id == id, (response as? HTTPURLResponse)?.statusCode == 200, data.count < 4 * 1024 * 1024,
              let page = String(data: data, encoding: .utf8),
              let tag = page.range(of: #"<script\b[^>]*\bid="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>"#, options: .regularExpression),
              let end = page.range(of: "</script>", range: tag.upperBound..<page.endIndex),
              let json = try JSONSerialization.jsonObject(with: Data(page[tag.upperBound..<end.lowerBound].utf8)) as? [String: Any],
              let scope = json["__DEFAULT_SCOPE__"] as? [String: Any],
              let context = scope["webapp.app-context"] as? [String: Any], let user = context["user"] as? [String: Any],
              let userId = user["uid"] as? String, userId.range(of: "^[0-9]{1,24}$", options: .regularExpression) != nil else {
            throw PassportError.session
        }
        var record = TikTokProfileRecord()
        record.userId = userId
        if let wid = context["wid"] as? String, wid.range(of: "^[0-9]{1,24}$", options: .regularExpression) != nil {
            record.deviceId = wid
        }
        return record
    }

    func inbox(id: String, payload: String, history: Bool) async throws -> String {
        let attempt = try authenticatedAttempt(id)
        guard payload.count < 16_384, let body = Data(base64Encoded: payload) else { throw PassportError.connection }
        let route = history ? "/v1/message/get_by_conversation" : "/v2/message/get_by_user_init"
        let cookies = attempt.session.configuration.httpCookieStorage?.cookies(for: Self.origin) ?? []
        var request = URLRequest(url: URL(string: "https://im-api-sg.tiktok.com" + route)!)
        request.httpMethod = "POST"
        request.httpShouldHandleCookies = false
        request.httpBody = body
        request.setValue("application/x-protobuf", forHTTPHeaderField: "Content-Type")
        request.setValue("application/x-protobuf", forHTTPHeaderField: "Accept")
        request.setValue(Self.origin.absoluteString, forHTTPHeaderField: "Origin")
        request.setValue(Self.origin.absoluteString + "/", forHTTPHeaderField: "Referer")
        request.setValue(Self.userAgent, forHTTPHeaderField: "User-Agent")
        request.setValue(HTTPCookie.requestHeaderFields(with: cookies)["Cookie"], forHTTPHeaderField: "Cookie")
        let (data, response) = try await attempt.session.data(for: request)
        guard self.attempt?.id == id, (response as? HTTPURLResponse)?.statusCode == 200,
              data.count <= 4 * 1024 * 1024 else { throw PassportError.connection }
        return data.base64EncodedString()
    }

    private func authenticatedAttempt(_ id: String) throws -> Attempt {
        guard let attempt, attempt.id == id,
              attempt.session.configuration.httpCookieStorage?.cookies(for: Self.origin)?.contains(where: {
                  $0.name == "sessionid" && !$0.value.isEmpty
              }) == true else { throw PassportError.session }
        return attempt
    }

    private enum PassportError: LocalizedError {
        case connection, session
        var errorDescription: String? {
            switch self {
            case .connection: return "Quiet couldn’t reach TikTok."
            case .session: return "TikTok did not return a usable session. Try a new code."
            }
        }
    }
}
