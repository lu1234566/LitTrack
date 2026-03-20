import React from 'react';
import { useLocalImage } from '../hooks/useLocalImage';

interface CoverImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  coverUrl?: string;
  coverSource?: string;
  fallbackUrl?: string;
}

export const CoverImage: React.FC<CoverImageProps> = ({ coverUrl, coverSource, fallbackUrl, ...props }) => {
  const imageUrl = useLocalImage(coverUrl, coverSource);
  const finalUrl = imageUrl || fallbackUrl;

  if (!finalUrl) {
    return null;
  }

  return <img src={finalUrl} {...props} />;
};
