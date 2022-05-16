import type { GetStaticPropsContext, InferGetStaticPropsType } from 'next';
import { useRouter } from 'next/router';
import { BuilderComponent, Builder, builder } from '@builder.io/react';
import DefaultErrorPage from 'next/error';
import Head from 'next/head';

const BUILDER_API_KEY = '77ef16bfb97145249d018edf89ba2eb0';
builder.init(BUILDER_API_KEY);

export async function getStaticProps({ params }: GetStaticPropsContext<{ header: string[] }>) {
  const header =
    (await builder
      .get('header', {
        userAttributes: {
          name: 'Header',
        },
      })
      .toPromise()) || null;

  return {
    props: {
      header,
    },
    revalidate: 5,
  };
}

export default function Section({ header }: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();
  if (router.isFallback) {
    return <h1>Loading...</h1>;
  }
  const isLive = !Builder.isEditing && !Builder.isPreviewing;
  if (!header && isLive) {
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

      <BuilderComponent model="section" content={header} />
    </>
  );
}
