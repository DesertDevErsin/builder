import '@builder.io/mitosis/dist/src/jsx-types';

declare global {
  declare namespace JSX {
    type CSSProperties = NonNullable<JSX.HTMLAttributes<never>['style']>;
    interface HTMLAttributes {
      children?: Element | Element[] | string | undefined | false;
      innerHTML?: string;
      dataSet?: {
        [key: string]: string;
      };
    }

    interface ImgHTMLAttributes {
      loading?: string;
      role?: string;
    }

    interface IntrinsicAttributes {
      key?: string | number;
    }
  }
}