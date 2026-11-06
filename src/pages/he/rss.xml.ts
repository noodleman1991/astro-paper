import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { getPath } from "@/utils/getPath";
import getSortedPosts from "@/utils/getSortedPosts";
import { SITE } from "@/config";
import { useTranslations } from "@/i18n";

export async function GET() {
  const posts = await getCollection("blog");
  const sortedPosts = getSortedPosts(posts);
  const t = useTranslations("he");
  return rss({
    title: SITE.title,
    description: t.site.desc,
    site: `${SITE.website}he/`,
    customData: "<language>he</language>",
    items: sortedPosts.map(({ data, id, filePath }) => ({
      link: `/he${getPath(id, filePath)}`,
      title: data.title,
      description: data.description,
      pubDate: new Date(data.modDatetime ?? data.pubDatetime),
    })),
  });
}
