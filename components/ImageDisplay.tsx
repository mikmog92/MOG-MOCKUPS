import React from 'react';
import Spinner from './Spinner';

interface ImageDisplayProps {
  title: string;
  imageUrls: string[] | null;
  isLoading: boolean;
  loadingMessage: string;
  placeholderText: string;
  onDownload?: (imageUrl: string, index: number) => void;
}

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const ImageDisplay: React.FC<ImageDisplayProps> = ({ title, imageUrls, isLoading, loadingMessage, placeholderText, onDownload }) => {
  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-4 text-zinc-300">{title}</h2>
      <div className="w-full aspect-square bg-zinc-900/50 rounded-lg flex items-center justify-center border-2 border-dashed border-zinc-700/80 overflow-hidden shadow-inner relative p-2">
        {imageUrls && imageUrls.length > 0 ? (
           <div className={`grid ${imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 w-full h-full`}>
            {imageUrls.map((url, index) => (
                <div key={index} className="relative group w-full h-full bg-black/20 rounded-md overflow-hidden">
                    <img src={url} alt={`${title} ${index + 1}`} className="w-full h-full object-contain" />
                    {onDownload && (
                    <button
                        onClick={() => onDownload(url, index)}
                        className="absolute top-2 right-2 bg-zinc-900/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-200"
                        aria-label={`Download image ${index + 1}`}
                        title={`Download Image ${index + 1}`}
                    >
                        <DownloadIcon />
                    </button>
                    )}
                </div>
            ))}
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center text-zinc-400">
            <Spinner />
            <p className="mt-2 animate-pulse">{loadingMessage}</p>
          </div>
        ) : (
          <p className="text-zinc-500 text-center">{placeholderText}</p>
        )}
      </div>
    </div>
  );
};

export default ImageDisplay;