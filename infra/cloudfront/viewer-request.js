// CloudFront Functions（viewer request, cloudfront-js-2.0）
// vercel.json の redirects と trailingSlash: true を再現し、ディレクトリ URL を index.html に補う。
// リダイレクト先は Vercel の多段リダイレクト（末尾スラッシュ付与 → 本来の移動先）を1回にまとめている。

function handler(event) {
    var request = event.request;
    var uri = request.uri;
    var m;

    // wwwなし（apex）→ www。Vercel と同じくパスとクエリはそのまま渡す
    if (request.headers.host && request.headers.host.value === "pachislot-setting.com") {
        return redirect("https://www.pachislot-setting.com" + uri, request);
    }

    if (uri === "/index.html") {
        return redirect("/", request);
    }

    // /guide/:slug・/articles/:slug（拡張子なし）→ /guide/:slug.html
    m = uri.match(/^\/(?:guide|articles)\/([^.\/]+)\/?$/);
    if (m) {
        return redirect("/guide/" + m[1] + ".html", request);
    }

    // 拡張子付きの /articles/:slug → /guide/:slug
    m = uri.match(/^\/articles\/([^\/]+?)\/?$/);
    if (m) {
        return redirect("/guide/" + m[1], request);
    }

    // 旧サブページ /machines/:machineId/(ceiling|setting|beginner) → /machines/:machineId/
    m = uri.match(/^\/machines\/([^\/]+)\/(?:ceiling|setting|beginner)\/?$/);
    if (m) {
        return redirect("/machines/" + m[1] + "/", request);
    }

    // trailingSlash: true … ファイル名（拡張子付き）はスラッシュを外し、それ以外は付ける
    var endsWithSlash = uri.slice(-1) === "/";
    var path = endsWithSlash ? uri.slice(0, -1) : uri;
    var lastSegment = path.slice(path.lastIndexOf("/") + 1);
    var isFile = lastSegment.indexOf(".") !== -1;
    if (endsWithSlash && isFile) {
        return redirect(path, request);
    }
    if (!endsWithSlash && !isFile) {
        return redirect(uri + "/", request);
    }

    // S3 は非公開（OAC）なので、ディレクトリ URL の index.html は自分で補う
    if (endsWithSlash) {
        request.uri = uri + "index.html";
    }
    return request;
}

function redirect(location, request) {
    return {
        statusCode: 308,
        statusDescription: "Permanent Redirect",
        headers: { location: { value: location + queryString(request.querystring) } },
    };
}

// event.request.querystring（{ key: { value, multiValue } }）を "?a=1&b=2" に戻す
function queryString(querystring) {
    var parts = [];
    Object.keys(querystring).forEach(function (key) {
        var param = querystring[key];
        var values = param.multiValue ? param.multiValue : [param];
        values.forEach(function (v) {
            parts.push(v.value === "" ? key : key + "=" + v.value);
        });
    });
    return parts.length ? "?" + parts.join("&") : "";
}
