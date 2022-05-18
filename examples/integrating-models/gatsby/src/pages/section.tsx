import * as React from 'react';
import { graphql } from 'gatsby';
import { BuilderComponent } from '@builder.io/react';

function Section({ data }: { data: any }) {
  const models = data?.allBuilderModels;
  const section = models.oneSection?.content;

  return <BuilderComponent name="section" content={section} />;
}

export default Section;

export const sectionQuery = graphql`
  query {
    allBuilderModels {
      oneSection(target: { name: "Header" }, options: { cachebust: true }) {
        content
      }
    }
  }
`;
