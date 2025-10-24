import React from 'react';
import { HistoryItem } from '../types';

interface HistorySidebarProps {
  history: HistoryItem[];
  onItemClick: (item: HistoryItem) => void;
  onClearHistory: () => void;
  isDisabled: boolean;
}

export const HistoryIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onItemClick, onClearHistory, isDisabled }) => {
  return (
    <aside className="bg-zinc-900/80 backdrop-blur-xl p-4 sm:p-6 rounded-lg shadow-2xl border border-zinc-700/50 flex flex-col max-h-[70vh]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center text-zinc-300 gap-2">
          <HistoryIcon />
          History
        </h2>
        <button
          onClick={onClearHistory}
          disabled={history.length === 0 || isDisabled}
          className="flex items-center text-sm text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-zinc-400"
        >
         <TrashIcon />
          Clear
        </button>
      </div>
      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
        {history.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-600 text-center py-12">
            <p>Your past mockups will appear here.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {history.map((item) => (
              <li
                key={item.id}
                onClick={() => onItemClick(item)}
                className="bg-zinc-800/70 p-3 rounded-lg cursor-pointer hover:bg-zinc-800 transition-all border border-zinc-700 hover:border-amber-500"
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                    <p className="text-sm font-medium text-zinc-200 truncate pr-2 flex-grow">{item.prompt}</p>
                    <span className="flex-shrink-0 text-xs bg-amber-600/50 text-amber-300 px-2 py-0.5 rounded-full">{item.style}</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <p className="text-xs text-zinc-400 mb-1 text-center">Artwork</p>
                    <img src={item.originalImageUrl} alt="Original Artwork Thumbnail" className="w-full aspect-square object-cover rounded" />
                  </div>
                  <div className="w-1/2">
                     <p className="text-xs text-zinc-400 mb-1 text-center">Mockups</p>
                     <div className={`grid ${item.editedImageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-1 bg-black/20 rounded-sm p-0.5`}>
                        {item.editedImageUrls.slice(0, 4).map((url, index) => (
                            <img key={index} src={url} alt={`Edited Mockup Thumbnail ${index + 1}`} className="w-full aspect-square object-cover rounded-sm" />
                        ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default HistorySidebar;