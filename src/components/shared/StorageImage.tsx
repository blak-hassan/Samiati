// src/components/shared/StorageImage.tsx
// Renders a Convex Storage file through next/image so it is resized,
// converted to avif/webp, and lazy-loaded like every other image in the app.
//
// The Convex storage host is allowlisted in next.config.ts
// (images.remotePatterns: https://*.convex.cloud). Callers control the
// on-screen size via className; the intrinsic dimensions are fixed at a
// high resolution and the browser scales down — this is the pattern
// next/image recommends for responsive images.
'use client';

import Image from 'next/image';
import { useMemo } from 'react';

interface StorageImageProps {
  storageId: string;
  alt: string;
  className?: string;
  /** Intrinsic width used by next/image. Defaults to 800. */
  width?: number;
  /** Intrinsic height used by next/image. Defaults to 600. */
  height?: number;
}

export function StorageImage({
  storageId,
  alt,
  className,
  width = 800,
  height = 600,
}: StorageImageProps) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const url = convexUrl ? `${convexUrl}/api/storage/${storageId}` : null;

  // Stable placeholder so the layout doesn't shift while the image loads.
  const blurDataURL = useMemo(
    () =>
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="%2342342b"/></svg>`,
    [width, height],
  );

  if (!url) {
    return (
      <div
        className={className}
        style={{ aspectRatio: `${width} / ${height}` }}
        aria-hidden
      />
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      decoding="async"
      placeholder="blur"
      blurDataURL={blurDataURL}
    />
  );
}