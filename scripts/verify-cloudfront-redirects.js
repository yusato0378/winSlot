/**
 * infra/cloudfront/viewer-request.js（CloudFront Functions）のリダイレクトと index.html の補完を検証する。
 * 実行: node scripts/verify-cloudfront-redirects.js
 *
 * 関数はコンソールで手で更新・発行するので、更新する前にこれを通す。
 * 本番の応答は curl -I https://www.pachislot-setting.com/... で別途確かめる。
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const FUNCTION_PATH = path.join(ROOT, "infra", "cloudfront", "viewer-request.js");

const WWW = "www.pachislot-setting.com";

/** [host, uri, querystring, 期待値]。期待値は { redirect: location } か { uri: S3 に渡す uri } */
const CASES = [
    // apex → www（パスとクエリはそのまま）
    ["pachislot-setting.com", "/", {}, { redirect: "https://www.pachislot-setting.com/" }],
    ["pachislot-setting.com", "/machines/hokuto/", { a: { value: "1" } }, { redirect: "https://www.pachislot-setting.com/machines/hokuto/?a=1" }],
    [WWW, "/index.html", {}, { redirect: "/" }],
    // guide・articles
    [WWW, "/guide/setting-basics", {}, { redirect: "/guide/setting-basics.html" }],
    [WWW, "/guide/setting-basics/", {}, { redirect: "/guide/setting-basics.html" }],
    [WWW, "/articles/setting-basics", {}, { redirect: "/guide/setting-basics.html" }],
    [WWW, "/articles/setting-basics/", {}, { redirect: "/guide/setting-basics.html" }],
    [WWW, "/articles/setting-basics.html", {}, { redirect: "/guide/setting-basics.html" }],
    // 機種LPの旧サブページ（末尾スラッシュ有無）
    ...["ceiling", "setting", "beginner"].flatMap(sub => [
        [WWW, `/machines/hokuto/${sub}`, {}, { redirect: "/machines/hokuto/" }],
        [WWW, `/machines/hokuto/${sub}/`, {}, { redirect: "/machines/hokuto/" }],
    ]),
    // 末尾スラッシュの統一
    [WWW, "/machines/hokuto", {}, { redirect: "/machines/hokuto/" }],
    [WWW, "/machines/hokuto", { x: { value: "", multiValue: [{ value: "" }, { value: "2" }] } }, { redirect: "/machines/hokuto/?x&x=2" }],
    [WWW, "/sitemap.xml/", {}, { redirect: "/sitemap.xml" }],
    // そのまま S3 へ（ディレクトリは index.html を補う）
    [WWW, "/", {}, { uri: "/index.html" }],
    [WWW, "/machines/hokuto/", {}, { uri: "/machines/hokuto/index.html" }],
    [WWW, "/guide/setting-basics.html", {}, { uri: "/guide/setting-basics.html" }],
    [WWW, "/sitemap.xml", {}, { uri: "/sitemap.xml" }],
];

function loadHandler() {
    const context = {};
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(FUNCTION_PATH, "utf8"), context, { filename: FUNCTION_PATH });
    return context.handler;
}

function main() {
    const handler = loadHandler();
    const failures = [];
    for (const [host, uri, querystring, expected] of CASES) {
        const request = { uri, querystring, headers: { host: { value: host } } };
        const res = handler({ request });
        const actual = res.statusCode
            ? { redirect: res.headers.location.value, status: res.statusCode }
            : { uri: res.uri };
        const ok = expected.redirect
            ? actual.status === 308 && actual.redirect === expected.redirect
            : actual.uri === expected.uri;
        if (!ok) failures.push(`${host}${uri}: 期待 ${JSON.stringify(expected)} / 実際 ${JSON.stringify(actual)}`);
    }
    if (failures.length) {
        failures.forEach(f => console.error(f));
        process.exit(1);
    }
    console.log(`OK: CloudFront の viewer-request 関数 ${CASES.length} パターンを確認しました。`);
}

main();
