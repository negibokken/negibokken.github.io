export function sanitize(str: string) {
    return str.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&#38;", "&").replaceAll("&#39;", "'").replaceAll("&#34;", "\"")
        .replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("&", "&#38;").replaceAll("'", "&#39;").replaceAll("\"", "&#34;");
}
