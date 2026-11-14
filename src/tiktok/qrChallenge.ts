import { signTikTokQrQuery } from './signing';

const origin = 'https://www.tiktok.com';
const referer = `${origin}/login/qrcode`;
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';

type ClientContext = {
  deviceId: string;
  verificationId: string;
  region: string;
  language: string;
  timeZone: string;
};

type PassportData = {
  token?: string;
  qrcode_index_url?: string;
  ttwid_migration_ticket?: string;
  status?: string;
  error_code?: number;
};

// The transport owns a cookie jar dedicated to this connection.
type PassportTransport = (url: string, headers: Record<string, string>) => Promise<unknown>;
type PollResult = 'new' | 'scanned' | 'expired' | 'confirmed' | 'verificationRequired';

export class TikTokQrChallenge {
  private challenge: { token: string; migrationTicket?: string } | undefined;
  private requestCount = 0;
  private busy = false;

  constructor(
    private readonly context: ClientContext,
    private readonly randomWords: () => Uint32Array,
    private readonly transport: PassportTransport,
  ) {}

  async start(): Promise<URL> {
    if (this.busy || this.challenge) throw new Error('A TikTok login challenge is already open.');
    this.busy = true;
    try {
      const data = await this.request('get_qrcode');
      if (typeof data.token !== 'string' || !data.token || typeof data.qrcode_index_url !== 'string') {
        throw new Error('TikTok did not issue a login challenge.');
      }
      const qr = new URL(data.qrcode_index_url);
      if (qr.origin !== origin || qr.pathname !== '/passport/web/scan_index/' || qr.searchParams.get('token') !== data.token) {
        throw new Error('TikTok returned an invalid QR link.');
      }
      this.challenge = { token: data.token, migrationTicket: migrationTicket(data) };
      return qr;
    } finally {
      this.busy = false;
    }
  }

  async poll(): Promise<PollResult> {
    if (this.busy || !this.challenge) throw new Error('No TikTok login challenge is ready to check.');
    this.busy = true;
    try {
      const data = await this.request('check_qrconnect', this.challenge);
      switch (data.status) {
        case 'new':
        case 'scanned':
          this.challenge.migrationTicket = migrationTicket(data) ?? this.challenge.migrationTicket;
          return data.status;
        case 'confirmed':
        case 'expired':
          this.challenge = undefined;
          return data.status;
        default:
          if (data.error_code === 2135) return 'verificationRequired';
          throw new Error('TikTok could not confirm the login challenge.');
      }
    } finally {
      this.busy = false;
    }
  }

  private async request(route: 'get_qrcode' | 'check_qrconnect', challenge?: { token: string; migrationTicket?: string }) {
    const query = new URLSearchParams(loginParameters(this.context));
    if (challenge) query.set('token', challenge.token);
    const now = Date.now();
    const material = () => ({ timestampMicrosLow: (now * 1000) >>> 0, keyWords: this.randomWords() });
    const signed = signTikTokQrQuery({ query: query.toString(), userAgent, timestampSeconds: Math.floor(now / 1000),
      requestCount: ++this.requestCount, dynosaur: material(), gnarly: material() });
    const headers: Record<string, string> = { 'User-Agent': userAgent, Accept: 'application/json', Referer: referer };
    if (challenge?.migrationTicket) headers['x-tt-passport-ttwid-ticket'] = challenge.migrationTicket;
    const payload = await this.transport(`${origin}/passport/web/${route}/?${signed}`, headers);
    if (!payload || typeof payload !== 'object' || !('data' in payload) || !payload.data || typeof payload.data !== 'object') {
      throw new Error('TikTok returned an invalid login response.');
    }
    return payload.data as PassportData;
  }
}

function migrationTicket(data: PassportData): string | undefined {
  return typeof data.ttwid_migration_ticket === 'string' ? data.ttwid_migration_ticket : undefined;
}

function loginParameters({ deviceId, verificationId, region, language, timeZone }: ClientContext) {
  const appLanguage = language.split('-')[0];
  return {
    next: origin,
    multi_login: '1',
    did: deviceId,
    locale: language,
    app_language: appLanguage,
    aid: '1459',
    account_sdk_source: 'web',
    sdk_version: '2.1.12-tiktok',
    language,
    verifyFp: verificationId,
    target_aid: '',
    standalone_aid: '',
    shark_extra: JSON.stringify({
      aid: 1459, app_name: 'Tik_Tok_Login', channel: 'tiktok_web', device_platform: 'web_pc',
      device_id: deviceId, region, priority_region: '', os: 'windows', referer: '', root_referer: '',
      cookie_enabled: true, screen_width: 1680, screen_height: 1050, browser_language: language,
      browser_platform: 'Win32', browser_name: 'Mozilla', browser_version: userAgent.replace('Mozilla/', ''),
      browser_online: true, verifyFp: verificationId, app_language: language, webcast_language: language,
      tz_name: timeZone, is_page_visible: true, focus_state: true, is_fullscreen: false,
      history_len: 3, user_is_login: false, data_collection_enabled: false,
    }),
  };
}
