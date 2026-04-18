import type { APIRoute, GetStaticPaths } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { getAllPublishedPosts, postHref } from '../../lib/posts';
import { ogTemplate } from '../../components/OgImage';

const interRegularUrl = new URL(
  '../../../node_modules/@fontsource/inter/files/inter-latin-400-normal.woff',
  import.meta.url,
);
const interBoldUrl = new URL(
  '../../../node_modules/@fontsource/inter/files/inter-latin-700-normal.woff',
  import.meta.url,
);
const fallbackPngUrl = new URL('../../../public/og/default.png', import.meta.url);

let cachedFonts: Array<{ name: string; data: Buffer; weight: 400 | 700; style: 'normal' }> | null = null;
async function loadFonts() {
  if (cachedFonts) return cachedFonts;
  const [regular, bold] = await Promise.all([
    readFile(fileURLToPath(interRegularUrl)),
    readFile(fileURLToPath(interBoldUrl)),
  ]);
  cachedFonts = [
    { name: 'Inter', data: regular, weight: 400, style: 'normal' },
    { name: 'Inter', data: bold, weight: 700, style: 'normal' },
  ];
  return cachedFonts;
}

let cachedFallback: Buffer | null = null;
async function loadFallback() {
  if (cachedFallback) return cachedFallback;
  cachedFallback = await readFile(fileURLToPath(fallbackPngUrl));
  return cachedFallback;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getAllPublishedPosts();
  return posts.map((p) => ({
    params: { slug: postHref(p).replace(/^\/|\/$/g, '') },
    props: { title: p.data.title, description: p.data.description },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { title, description } = props as { title: string; description: string };
  try {
    const fonts = await loadFonts();
    const svg = await satori(ogTemplate(title, description) as any, {
      width: 1200,
      height: 630,
      fonts,
    });
    const png = new Resvg(svg).render().asPng();
    return new Response(png, { headers: { 'Content-Type': 'image/png' } });
  } catch (err) {
    console.warn('[og] generation failed, using fallback', err);
    const fallback = await loadFallback();
    return new Response(fallback, { headers: { 'Content-Type': 'image/png' } });
  }
};
