import * as React from 'react';
import { graphql } from 'gatsby';

function Data({ data }: { data: any }) {
  console.log(data)
  const models = data?.allBuilderModels;
  const pricing = models.pricing;

  return (
    <>
      {pricing.map((product: any) => (
        <h1 style={{ textAlign: 'center' }}>
          {product.name}: {product.content.data.price}
        </h1>
      ))}
    </>
  )
}

export default Data;

export const dataQuery = graphql`
  query {
    allBuilderModels {
      pricing(sort: { price: 1 }, options: { cachebust: true }) {
        name
        content
      }
    }
  }
`;
