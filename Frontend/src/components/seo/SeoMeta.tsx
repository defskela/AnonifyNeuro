import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoMetaProps {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  ogType?: string;
  image?: string;
  jsonLd?: Record<string, unknown>;
}

const getSiteUrl = (): string => {
  const envUrl = import.meta.env.VITE_SITE_URL as string | undefined;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

export const SeoMeta: React.FC<SeoMetaProps> = ({
  title,
  description,
  path,
  noindex = false,
  ogType = 'website',
  image,
  jsonLd,
}) => {
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}${path}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      {image ? <meta property="og:image" content={image} /> : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image ? <meta name="twitter:image" content={image} /> : null}

      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  );
};
