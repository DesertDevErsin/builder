import * as React from 'react';
import { graphql } from 'gatsby';
import { BuilderComponent } from '@builder.io/react';

function PageTemplate({ data }: { data: any }) {
  const models = data?.allBuilderModels;
  const page = models.page[0]?.content;

  return <BuilderComponent name="page" content={page} />;
}

export default PageTemplate;

export const pageQuery = graphql`
  query ($path: String!) {
    allBuilderModels {
      page(target: { urlPath: $path }, limit: 1, options: { cachebust: true }) {
        content
      }
    }
  }
`;
