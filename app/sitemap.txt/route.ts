import sitemap from "../sitemap";

export const dynamic = "force-static";

export function GET() {
  const urls = sitemap().map((entry) => entry.url).join("\n");

  return new Response(`${urls}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
