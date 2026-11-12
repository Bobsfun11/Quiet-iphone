import { getPlatform, type PlatformId } from '../model/platforms';

// Plain JavaScript is intentional: this exact source runs in WKWebView and in
// real-browser regression tests. Do not insert remote scripts or inspect forms.
export function buildFilterScript(platformId: PlatformId, preview = false): string {
  const platform = getPlatform(platformId);
  const config = JSON.stringify({
    id: platform.id, domains: platform.domains, patterns: platform.blockedPaths,
    selectors: platform.selectors, preview,
  }).replace(/</g, '\\u003c');
  return String.raw`
(function(config) {
  'use strict';
  if (window.top !== window.self && !config.preview) return;
  var matchesHost = function(host) {
    return config.domains.some(function(domain) {
      return host === domain || host.endsWith('.' + domain);
    });
  };
  if (!config.preview && !matchesHost(location.hostname)) return;
  if (window.__quietFilterInstalled) {
    try { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({channel:'quiet-v1',type:'ready'})); } catch (_) {}
    return;
  }
  window.__quietFilterInstalled = true;
  var styleId = 'quiet-filter-css';
  var overlayId = 'quiet-feed-guard';
  var hidden = new WeakSet();
  var lastAllowed = location.href;
  var scheduled = false;
  var selectors = config.selectors;
  var css = selectors.map(function(s) { return s + '{display:none!important;}'; }).join('\n') +
    '[data-quiet-hidden]{display:none!important;}' +
    '#' + overlayId + '{position:fixed!important;inset:0!important;z-index:2147483647!important;' +
    'display:flex!important;align-items:center!important;justify-content:center!important;' +
    'background:#f6f5ef!important;color:#20372e!important;font-family:system-ui,sans-serif!important;padding:28px!important;}' +
    '#' + overlayId + ' button{background:#254b3b;color:white;border:0;border-radius:24px;padding:14px 24px;font:inherit;margin-top:16px;cursor:pointer;}';
  function send(type, count) {
    try {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({channel:'quiet-v1',type:type,count:count}));
    } catch (_) {}
  }
  function blocked(raw) {
    try {
      var u = new URL(raw, location.href);
      if (u.protocol !== 'https:' || !matchesHost(u.hostname)) return false;
      var path;
      try { path = decodeURIComponent(u.pathname); } catch (_) { path = u.pathname; }
      path = path.replace(/\/{2,}/g, '/');
      return config.patterns.some(function(p) { return new RegExp(p, 'i').test(path); });
    } catch (_) { return false; }
  }
  function addStyle() {
    if (document.getElementById(styleId) || !document.documentElement) return;
    var style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.documentElement.appendChild(style);
  }
  function pauseVideos() {
    document.querySelectorAll('video, audio').forEach(function(media) {
      try { media.pause(); } catch (_) {}
    });
  }
  function dismissGuard() {
    var guard = document.getElementById(overlayId);
    if (guard) guard.remove();
  }
  function showGuard() {
    pauseVideos();
    if (!document.documentElement || document.getElementById(overlayId)) return;
    var guard = document.createElement('section');
    guard.id = overlayId;
    guard.setAttribute('role', 'dialog');
    guard.setAttribute('aria-modal', 'true');
    guard.setAttribute('aria-label', 'Short video feed blocked');
    var card = document.createElement('div');
    card.style.cssText = 'text-align:center;max-width:310px;line-height:1.6';
    var title = document.createElement('h1');
    title.textContent = 'A little space to breathe.';
    title.style.cssText = 'font-size:27px;line-height:1.2;font-weight:600';
    var copy = document.createElement('p');
    copy.textContent = 'This short-video feed is kept out of Quiet. Your conversations and regular browsing are still here.';
    var button = document.createElement('button');
    button.textContent = 'Back to what matters';
    button.addEventListener('click', function() {
      if (blocked(location.href)) {
        var fallback = config.id === 'tiktok' ? 'https://www.tiktok.com/messages' :
          config.id === 'snapchat' ? 'https://web.snapchat.com/' :
          config.id === 'youtube' ? 'https://m.youtube.com/' : 'https://www.instagram.com/';
        location.replace(!blocked(lastAllowed) ? lastAllowed : fallback);
      } else dismissGuard();
    });
    card.append(title, copy, button);
    guard.appendChild(card);
    document.documentElement.appendChild(guard);
    button.focus();
    send('feed-blocked');
  }
  function inspectRoute() {
    if (blocked(location.href)) showGuard();
    else { lastAllowed = location.href; }
  }
  function scan() {
    scheduled = false;
    addStyle();
    var count = 0;
    function hide(element) {
      if (!element.hasAttribute('data-quiet-hidden')) element.setAttribute('data-quiet-hidden', '');
      if (!hidden.has(element)) { hidden.add(element); count++; }
      element.querySelectorAll('video, audio').forEach(function(media) { try { media.pause(); } catch (_) {} });
    }
    selectors.forEach(function(selector) {
      var elements;
      try { elements = document.querySelectorAll(selector); } catch (_) { return; }
      elements.forEach(hide);
    });
    // URL semantics cover absolute URLs, encoded paths, localized labels and
    // navigation markup changes without searching conversation text.
    document.querySelectorAll('a[href]').forEach(function(link) {
      if (!blocked(link.href)) return;
      var item = config.id === 'youtube' ? link.closest('ytd-rich-item-renderer,ytm-rich-item-renderer,ytd-video-renderer,ytm-video-with-context-renderer,ytm-reel-item-renderer,yt-shorts-lockup-view-model,ytm-shorts-lockup-view-model') : null;
      hide(item || link);
    });
    if (count) send('hidden', Math.min(count, 10000));
    inspectRoute();
  }
  function schedule() {
    if (!scheduled) { scheduled = true; setTimeout(scan, 32); }
  }
  // Content is inserted lazily by these sites. Observe structural changes and
  // route attributes, not form values, keystrokes, messages or other page data.
  var observer = new MutationObserver(schedule);
  observer.observe(document, {childList:true, subtree:true, attributes:true, attributeFilter:['href','aria-label']});
  document.addEventListener('click', function(event) {
    var element = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (element && blocked(element.href)) {
      event.preventDefault(); event.stopImmediatePropagation(); showGuard();
    }
  }, true);
  ['pushState', 'replaceState'].forEach(function(method) {
    var original = history[method];
    history[method] = function(state, unused, url) {
      if (url != null && blocked(new URL(url, location.href).href)) { showGuard(); return; }
      var result = original.apply(this, arguments);
      inspectRoute(); schedule(); return result;
    };
  });
  window.addEventListener('popstate', function() { inspectRoute(); schedule(); });
  window.addEventListener('hashchange', inspectRoute);
  document.addEventListener('play', function(event) {
    if (blocked(location.href) || (event.target instanceof Element && event.target.closest('[data-quiet-hidden]')))
      try { event.target.pause(); } catch (_) {}
  }, true);
  document.addEventListener('DOMContentLoaded', scan, {once:true});
  window.addEventListener('pagehide', function() { observer.disconnect(); }, {once:true});
  window.addEventListener('pageshow', function() {
    observer.observe(document, {childList:true, subtree:true, attributes:true, attributeFilter:['href','aria-label']});
    scan();
  });
  scan();
  send('ready');
})(${config});
true;
`;
}
