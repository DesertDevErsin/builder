import type { GatsbyConfig } from 'gatsby';
import path from 'path';

const config: GatsbyConfig = {
  siteMetadata: {
    title: `My Gatsby Site`,
    siteUrl: `https://www.yourdomain.tld`,
  },
  plugins: [
    {
      resolve: '@builder.io/gatsby',
      options: {
        publicAPIKey: '77ef16bfb97145249d018edf89ba2eb0',
        templates: {
          // Render every `page` model as a new page using the
          // src/templates/Page.tsx template based on the URL provided in Builder.io
          page: path.resolve('src/templates/Page.tsx'),
        },
      },
    },
  ],
};

export default config;
