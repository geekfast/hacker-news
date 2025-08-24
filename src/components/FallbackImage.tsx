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

  // Show placeholder if no src, has error, or src is empty string
  if (hasError || !src || src.trim() === '') {
    console.log('Showing placeholder because:', { hasError, noSrc: !src, emptyString: src?.trim() === '' });
    return (
      <div className={`${className} bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden`}>
        <Image
          src={placeholderSrc}
          alt="Content placeholder"
          width={width}
          height={height}
          className={className}
          priority={false}
        />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {isLoading && (
        <div className={`absolute inset-0 ${className} bg-gray-100 dark:bg-gray-700 animate-pulse flex items-center justify-center z-10`}>
          <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
        </div>
      )}
      <Image
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
    </div>
  );
}
