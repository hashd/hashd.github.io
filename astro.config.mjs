import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeMermaid from 'rehype-mermaid';

export default defineConfig({
  site: 'https://kiran.danduprolu.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  output: 'static',
  integrations: [
    mdx(),
    sitemap({ filter: (page) => !page.includes('/og/') }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      defaultColor: false,
      wrap: true,
    },
    rehypePlugins: [[rehypeMermaid, { strategy: 'inline-svg' }]],
  },
  vite: {
    server: { watch: { ignored: ['**/legacy/**'] } },
  },
});
