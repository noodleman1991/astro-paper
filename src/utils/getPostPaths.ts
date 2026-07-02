import { getCollection } from "astro:content";
import { getPath } from "./getPath";

/** Static paths for post detail routes — shared by the en and he routes. */
export async function getPostStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.map(post => ({
    params: { slug: getPath(post.id, post.filePath, false) },
    props: { post },
  }));
}
