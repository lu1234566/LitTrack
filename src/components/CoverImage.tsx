import React, { useState, useEffect } from 'react';
import { useLocalImage } from '../hooks/useLocalImage';
import { Book as BookIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface CoverImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  coverUrl?: string;
  coverSource?: string;
  fallbackUrl?: string;
  isbn?: string;
  title?: string;
  author?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const CoverImage: React.FC<CoverImageProps> = ({ 
  coverUrl, 
  coverSource, 
  fallbackUrl, 
  isbn, 
  title, 
  author,
  size = 'md',
  className,
  ...props 
}) => {
  const localUrl = useLocalImage(coverUrl, coverSource);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [isFinalFallback, setIsFinalFallback] = useState(false);

  useEffect(() => {
    // Reset states when coverUrl/isbn changes
    setCurrentSrc(localUrl || coverUrl || null);
    setErrorCount(0);
    setIsFinalFallback(false);
  }, [localUrl, coverUrl, isbn]);

  const handleImageError = () => {
    const nextErrorCount = errorCount + 1;
    setErrorCount(nextErrorCount);

    // Try multiple sources in order
    if (nextErrorCount === 1 && isbn) {
      // Try Open Library
      const cleanIsbn = isbn.replace(/[- ]/g, '');
      if (cleanIsbn.length >= 10) {
        setCurrentSrc(`https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false`);
        return;
      }
    }

    if (nextErrorCount === 2 && fallbackUrl) {
      setCurrentSrc(fallbackUrl);
      return;
    }

    // If all else fails, use internal placeholder
    setIsFinalFallback(true);
  };

  if (isFinalFallback || !currentSrc) {
    const initials = title 
      ? title.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() 
      : '?';

    return (
      <div 
        className={cn(
          "flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 text-center p-4 relative overflow-hidden",
          size === 'sm' ? "h-24" : size === 'md' ? "h-40" : size === 'lg' ? "h-56" : "h-72",
          className
        )}
      >
        <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
          <BookIcon size={120} />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="text-2xl font-serif font-black text-neutral-800 tracking-tighter">
            {initials}
          </div>
          {title && <span className="block text-[8px] font-black uppercase text-neutral-600 line-clamp-2 px-1 tracking-widest">{title}</span>}
          {author && <span className="block text-[7px] font-serif italic text-neutral-700 line-clamp-1 opacity-60">{author}</span>}
        </div>
        <div className="absolute bottom-2 right-2 opacity-20">
          <BookIcon size={14} className="text-neutral-500" />
        </div>
      </div>
    );
  }

  // Ensure https
  const srcWithHttps = currentSrc.startsWith('http:') ? currentSrc.replace('http:', 'https:') : currentSrc;

  return (
    <img 
      src={srcWithHttps} 
      onError={handleImageError}
      className={cn("object-cover", className)}
      {...props} 
    />
  );
};
