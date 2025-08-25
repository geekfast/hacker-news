'use client';

import { useState } from 'react';
import Image from 'next/image';

interface FallbackImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackType?: 'grid' | 'list';
}

export default function FallbackImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackType = 'grid'
}: FallbackImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const placeholderSrc = fallbackType === 'list' 
    ? '/placeholder-small.svg' 
    : '/placeholder.svg';

  console.log('FallbackImage received src:', src, 'fallbackType:', fallbackType);

  const handleError = () => {
    console.log('Image failed to load:', src);
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    console.log('Image loaded successfully:', src);
    setIsLoading(false);
  };

  // Show placeholder if has error or src is invalid
  if (hasError || !src || src.trim() === '' || src.includes('placeholder')) {
    return (
      <div className={`${className} bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden`}>
        <img
          src={placeholderSrc}
          alt="Content placeholder"
          width={width}
          height={height}
          className={className}
        />
      </div>
    );
  }

  // Render a standard <img> tag to bypass Next.js Image optimization for testing
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      style={{ 
        display: isLoading ? 'none' : 'block',
        opacity: isLoading ? 0 : 1,
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  );
}
