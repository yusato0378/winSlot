/**
 * Google アナリティクス（GA4）の計測タグを dist/ の全 HTML の </head> 直前に入れる。
 * ソースの HTML は手で管理しているページが多く、1枚ずつ書くと入れ忘れが出るので出力側で入れる。
 *
 * 本番（Vercel の production デプロイ、または DEPLOY_ENV=production の AWS デプロイ）だけで入れる。ローカルの確認やプレビューで
 * 自分のアクセスが計測に混ざらないようにするため。
 * 送るのはページの閲覧と、ツールの使い方の種類（app.js の trackAnalyze）だけ。入力したゲーム数・回数などの数値は送らない（プライバシーポリシー参照）。
 */
const fs = require("fs");
const path = require("path");

/** GA4 の測定 ID（G-XXXXXXXXXX）。空のあいだはタグを入れない */
const GA_MEASUREMENT_ID = "G-MWH8XCWXVW";

function analyticsTag(id) {
    return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","${id}");</script>
`;
}

function injectAnalytics(dir) {
    if (!GA_MEASUREMENT_ID) {
        console.log("Analytics: 測定 ID が未設定のためスキップ");
        return;
    }
    if (process.env.VERCEL_ENV !== "production" && process.env.DEPLOY_ENV !== "production") {
        console.log("Analytics: 本番デプロイではないためスキップ");
        return;
    }
    const tag = analyticsTag(GA_MEASUREMENT_ID);
    let files = 0;
    const walk = d => {
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
            const p = path.join(d, entry.name);
            if (entry.isDirectory()) { walk(p); continue; }
            if (!entry.name.endsWith(".html")) continue;
            const src = fs.readFileSync(p, "utf8");
            if (!src.includes("</head>")) throw new Error(`Analytics: </head> がありません: ${path.relative(dir, p)}`);
            fs.writeFileSync(p, src.replace("</head>", tag + "</head>"), "utf8");
            files++;
        }
    };
    walk(dir);
    console.log(`Analytics: GA4（${GA_MEASUREMENT_ID}）を ${files} ファイルに追加`);
}

module.exports = { injectAnalytics, analyticsTag, GA_MEASUREMENT_ID };
