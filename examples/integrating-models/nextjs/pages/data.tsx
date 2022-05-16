import type { GetStaticPropsContext, InferGetStaticPropsType } from 'next';
import { useRouter } from 'next/router';
import { BuilderComponent, Builder, builder } from '@builder.io/react';
import DefaultErrorPage from 'next/error';
import Head from 'next/head';

const BUILDER_API_KEY = '77ef16bfb97145249d018edf89ba2eb0';
builder.init(BUILDER_API_KEY);

const formatPrice = (price: number) => {
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  return formatter.format(price);
};

export async function getStaticProps({ params }: GetStaticPropsContext<{ pricing: string[] }>) {
  const pricing =
    (await builder.getAll('pricing', {
      sort: 1,
    })) || null;

  return {
    props: {
      pricing,
    },
    revalidate: 5,
  };
}

export default function Data({ pricing }: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();
  if (router.isFallback) {
    return <h1>Loading...</h1>;
  }
  const isLive = !Builder.isEditing && !Builder.isPreviewing;
  if (!pricing && isLive) {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex" />
          <meta name="title"></meta>
        </Head>
        <DefaultErrorPage statusCode={404} />
      </>
    );
  }

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {pricing.map(product => (
        <div style={{ textAlign: 'center' }}>
          {product.name}: {formatPrice(product.data.price)}
        </div>
      ))}
    </>
  );
}
