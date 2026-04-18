import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export function postHref(post: Post): string {
  const date = post.data.date;
  const year = date.getUTCFullYear().toString();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const slug = post.data.slug ?? post.slug.replace(/^\d{4}-\d{2}-\d{2}-/, '');
  return `/${year}/${month}/${slug}/`;
}

function sortByDateDesc(a: Post, b: Post) {
  return b.data.date.getTime() - a.data.date.getTime();
}

export async function getAllPublishedPosts(): Promise<Post[]> {
  const all = await getCollection('posts', ({ data }) => data.draft !== true);
  return all.sort(sortByDateDesc);
}

export async function getLivePosts(): Promise<Post[]> {
  const all = await getAllPublishedPosts();
  return all.filter((p) => !p.data.archived);
}

export async function getArchivedPosts(): Promise<Post[]> {
  const all = await getAllPublishedPosts();
  return all.filter((p) => p.data.archived);
}

export async function getFeaturedLivePosts(): Promise<Post[]> {
  return (await getLivePosts()).filter((p) => p.data.featured);
}

export async function getAdjacentLivePosts(current: Post): Promise<{
  prev: Post | null;
  next: Post | null;
}> {
  if (current.data.archived) return { prev: null, next: null };
  const live = await getLivePosts();
  const idx = live.findIndex((p) => p.id === current.id);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx < live.length - 1 ? live[idx + 1] : null,
    next: idx > 0 ? live[idx - 1] : null,
  };
}

export async function getAllTagsWithCounts(): Promise<
  Array<{ tag: string; count: number }>
> {
  const all = await getAllPublishedPosts();
  const counts = new Map<string, number>();
  for (const p of all) {
    for (const t of p.data.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
