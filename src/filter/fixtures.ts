import { getPlatform, type PlatformId } from '../model/platforms';

// Local, invented content for tests and the clearly labelled browser preview.
// Never used as a replacement for a real platform inside the iPhone app.
export function demoHTML(id: PlatformId): string {
  const platform = getPlatform(id);
  const shortURL = id === 'instagram' ? '/reels/' : id === 'youtube' ? '/shorts/clip' : id === 'tiktok' ? '/foryou' : '/spotlight/clip';
  const normalURL = id === 'instagram' ? '/direct/inbox/' : id === 'youtube' ? '/watch?v=regular' : id === 'tiktok' ? '/messages' : '/chat';
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${platform.home}">
  <style>*{box-sizing:border-box}body{margin:0;background:#fff;color:#26372e;font:14px system-ui,sans-serif}header{padding:24px 20px 18px;border-bottom:1px solid #eee;font-size:25px;font-weight:650;letter-spacing:-1px}nav{display:flex;gap:18px;padding:15px 20px;border-bottom:1px solid #eee}a{color:#295440;text-decoration:none}main{padding:22px 20px}h1{font:28px Georgia;margin:12px 0}p{color:#727d72;line-height:1.7}.picture{height:160px;border-radius:18px;background:linear-gradient(140deg,#b5cbb2,#e2e4b8);display:flex;align-items:center;justify-content:center;font-size:47px}article{border:1px solid #eceee7;border-radius:20px;padding:18px;margin:18px 0}small{color:#84907f}.avatar{width:32px;height:32px;border-radius:50%;background:#dce6d6;display:inline-block;vertical-align:middle;margin-right:8px}input{width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;margin:4px 0}</style>
  </head><body><header>${platform.name}</header><nav><a id="normal-link" href="${normalURL}">Conversations</a><a id="profile-link" href="${id === 'tiktok' ? '/@friend' : '/profile/friend'}">Profile</a><a id="short-link" href="${shortURL}">Short videos</a></nav>
  <main><small>QUIET · SAMPLE CONTENT</small><h1>A little more connection.</h1><p>This is a local preview. On your iPhone, you’ll sign in to ${platform.name}’s actual website.</p>
  <article id="regular-content"><p style="margin-top:0"><span class="avatar"></span><b>A friend’s weekend</b></p><div class="picture">☀</div><p>Slow mornings, good company.</p><a href="${normalURL}" id="message-link">Send a message →</a></article>
  <article data-quiet-short-form="${id}" id="short-shelf">Short-video recommendations <video id="short-media" muted></video></article>
  <article id="regular-video"><p>Regular videos and conversations stay available.</p><video id="long-media" controls aria-label="Regular long video"></video></article>
  <form id="login-form"><label>Email<input id="email" type="email" placeholder="Sample login field"></label><label>Password<input id="password" type="password"></label><button type="button">Sign in</button></form>
  </main></body></html>`;
}
