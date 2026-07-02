import { preferredLocale } from "../src/i18n/preferredLocale";

interface RootContext {
  request: Request;
  env: { ASSETS: { fetch: (request: Request) => Promise<Response> } };
}

// First-visit language detection, root path only. An explicit choice
// (lang-pref cookie, set by the header toggle) always wins; otherwise
// Accept-Language decides. Deeper URLs are never redirected.
export const onRequestGet = async ({
  request,
  env,
}: RootContext): Promise<Response> => {
  const cookie = request.headers.get("cookie") ?? "";
  const pref = /(?:^|;\s*)lang-pref=(en|he)/.exec(cookie)?.[1];
  const locale =
    pref ?? preferredLocale(request.headers.get("accept-language"));

  if (locale === "he") {
    return new Response(null, {
      status: 302,
      headers: {
        location: new URL("/he/", request.url).toString(),
        vary: "Accept-Language, Cookie",
        "cache-control": "no-store",
      },
    });
  }
  const response = await env.ASSETS.fetch(request);
  const headers = new Headers(response.headers);
  headers.append("vary", "Accept-Language, Cookie");
  return new Response(response.body, { status: response.status, headers });
};
