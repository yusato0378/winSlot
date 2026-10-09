/* Service Worker（PWA）
 * ビルド（scripts/build/pwa.js）が __VERSION__ と __PRECACHE__ を埋めて dist/sw.js に出す。
 *
 * 方針: 通信できるときは必ず最新を取りに行く（ネットワーク優先）。圏外のときと、
 * 電波が弱くて数秒待っても返ってこないときだけ、前に開いたときの保存分を出す。
 * キャッシュ優先にすると、機種データを直しても古い数字が出続けるため。
 */
const VERSION = "__VERSION__";
const CACHE = `winslot-${VERSION}`;
const PRECACHE = __PRECACHE__;
// 保存分があるときに、ネットワークを待つ上限。これを過ぎたら保存分を出す（裏で取得は続け、次回用に保存する）
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    // ビルドが変わったら前のバージョンの保存分を消す
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k.startsWith("winslot-") && k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const req = event.request;
    const url = new URL(req.url);
    // 広告・フォントなど他サイトのリクエストと、GET 以外には関わらない
    if (req.method !== "GET" || url.origin !== self.location.origin) return;
    event.respondWith(networkFirst(event, req));
});

async function networkFirst(event, req) {
    const cache = await caches.open(CACHE);
    const fromNetwork = fetch(req).then(res => {
        if (res.ok && res.type === "basic") cache.put(req, res.clone());
        return res;
    });
    // 取得が待ち時間を超えても、Service Worker が止められないようにする（次回用の保存を最後まで行う）
    event.waitUntil(fromNetwork.catch(() => {}));

    const cached = await cache.match(req, { ignoreSearch: req.mode === "navigate" });
    // 保存分の無いページ（初めて開くページ）は待つしかない。圏外ならブラウザの通常のエラー表示になる
    if (!cached) return fromNetwork;
    const timeout = new Promise(resolve => setTimeout(() => resolve(cached), NETWORK_TIMEOUT_MS));
    return Promise.race([fromNetwork.catch(() => cached), timeout]);
}
