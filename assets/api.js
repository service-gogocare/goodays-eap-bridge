/**
 * api.js — 與 GAS Web App 溝通的共用函式。
 * CORS 關鍵：POST 一律用 text/plain + JSON 字串，不加任何自訂 header（見 CLAUDE.md §4.1）。
 */
(function () {
  function base() {
    var url = (window.APP_CONFIG && window.APP_CONFIG.WEBAPP_URL) || '';
    if (!url || url.indexOf('請填入') >= 0) {
      throw new Error('尚未設定 WEBAPP_URL，請編輯 assets/config.js。');
    }
    return url;
  }

  // 除錯模式時在 URL 附上 debug=1（GET/POST 皆讀 query string）
  function withDebug(url) {
    if (window.APP_CONFIG && window.APP_CONFIG.DEBUG) {
      return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'debug=1';
    }
    return url;
  }

  // GET：參數放 query string
  async function apiGet(params) {
    var qs = Object.keys(params).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    }).join('&');
    var res = await fetch(withDebug(base() + '?' + qs), { method: 'GET' });
    return parse(res);
  }

  // POST：body 放 JSON 字串，Content-Type 用 text/plain（避免 preflight）
  async function apiPost(payload) {
    var res = await fetch(withDebug(base()), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return parse(res);
  }

  async function parse(res) {
    var text = await res.text();
    var json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error('伺服器回應格式錯誤，請稍後再試。');
    }
    if (!json.ok) {
      var err = new Error((json.error && json.error.message) || '發生未知錯誤。');
      err.code = json.error && json.error.code;
      throw err;
    }
    return json.data;
  }

  window.API = { get: apiGet, post: apiPost };
})();
