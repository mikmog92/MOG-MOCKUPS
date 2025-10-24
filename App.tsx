import React, { useState, useCallback } from 'react';
import { HistoryItem } from './types';
import { editImageWithPrompt } from './services/geminiService';
import Spinner from './components/Spinner';
import ImageDisplay from './components/ImageDisplay';
import HistorySidebar, { HistoryIcon } from './components/HistorySidebar';

// Helper to convert file to base64 for display
const fileToBase64Promise = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

interface EditState {
    prompt: string;
    style: string;
    numResults: number;
    editedImageUrls: string[] | null;
}

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-zinc-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);

const GenerateIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const UndoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8a5 5 0 000-10H9" />
    </svg>
);

const RedoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 15l3-3m0 0l-3-3m3 3H8a5 5 0 000 10h3" />
    </svg>
);

const styles = ['Photorealistic', 'Minimalist', 'Grunge', 'Vintage'];

const App: React.FC = () => {
    const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
    const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);
    const [editedImages, setEditedImages] = useState<string[] | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [selectedStyle, setSelectedStyle] = useState<string>('Grunge');
    const [numResults, setNumResults] = useState<number>(1);
    const [loadingState, setLoadingState] = useState<'uploading' | 'generating' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    
    const [undoStack, setUndoStack] = useState<EditState[]>([]);
    const [redoStack, setRedoStack] = useState<EditState[]>([]);

    const pushToUndoStack = () => {
        const currentState: EditState = {
            prompt,
            style: selectedStyle,
            numResults,
            editedImageUrls: editedImages,
        };
        setUndoStack(prev => [...prev, currentState]);
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setEditedImages(null);
            setError(null);
            setLoadingState('uploading');
            setUndoStack([]);
            setRedoStack([]);
            try {
                const base64 = await fileToBase64Promise(file);
                setOriginalImageFile(file);
                setOriginalImageBase64(base64);
            } catch (e) {
                setError("Failed to load image.");
            } finally {
                setLoadingState(null);
            }
        }
    };

    const handleSubmit = useCallback(async () => {
        if (!originalImageFile || !prompt) {
            setError('Please upload your artwork and provide a mockup prompt.');
            return;
        }
        setLoadingState('generating');
        setError(null);
        setEditedImages(null);
        
        pushToUndoStack();
        setRedoStack([]);

        try {
            const finalPrompt = `Generate a ${selectedStyle.toLowerCase()} product mockup image showcasing multiple items (like t-shirts, posters, or mugs) on a relevant, dark, and atmospheric background, featuring the provided artwork. The user's specific request is: "${prompt}". Ensure the mockups look professional and are suitable for an e-commerce store for a rock band.`;
            const resultBase64Array = await editImageWithPrompt(originalImageFile, finalPrompt, numResults);
            setEditedImages(resultBase64Array);
            
            if (originalImageBase64) {
                 const newHistoryItem: HistoryItem = {
                    id: new Date().toISOString() + Math.random(),
                    prompt,
                    style: selectedStyle,
                    originalImageUrl: originalImageBase64,
                    editedImageUrls: resultBase64Array,
                };
                setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
            }
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred.');
        } finally {
            setLoadingState(null);
        }
    }, [originalImageFile, originalImageBase64, prompt, selectedStyle, numResults, editedImages]);
    
    const handleHistoryItemClick = (item: HistoryItem) => {
        if (loadingState !== null) return;

        pushToUndoStack();
        setRedoStack([]);
        
        setOriginalImageFile(null); 
        setOriginalImageBase64(item.originalImageUrl);
        setEditedImages(item.editedImageUrls);
        setPrompt(item.prompt);
        setSelectedStyle(item.style);
        setError(null);
        setIsHistoryOpen(false);
    };

    const handleUndo = () => {
        if (undoStack.length === 0) return;

        const currentState: EditState = { prompt, style: selectedStyle, numResults, editedImageUrls: editedImages };
        setRedoStack(prev => [currentState, ...prev]);

        const lastState = undoStack[undoStack.length - 1];
        setPrompt(lastState.prompt);
        setSelectedStyle(lastState.style);
        setNumResults(lastState.numResults);
        setEditedImages(lastState.editedImageUrls);

        setUndoStack(prev => prev.slice(0, prev.length - 1));
    };

    const handleRedo = () => {
        if (redoStack.length === 0) return;

        pushToUndoStack();

        const nextState = redoStack[0];
        setPrompt(nextState.prompt);
        setSelectedStyle(nextState.style);
        setNumResults(nextState.numResults);
        setEditedImages(nextState.editedImageUrls);

        setRedoStack(prev => prev.slice(1));
    };

    const handleClearHistory = () => {
        if (loadingState !== null) return;
        setHistory([]);
    };
    
    const handleDownload = (imageUrl: string, index: number) => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        const extension = imageUrl.match(/^data:image\/(\w+);base64,/)?.[1] || 'png';
        const filename = prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'merch_mockup';
        link.download = `${filename}_${selectedStyle.toLowerCase()}_${index + 1}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const isLoading = loadingState !== null;
    const canUndo = undoStack.length > 0 && !isLoading;
    const canRedo = redoStack.length > 0 && !isLoading;

    return (
        <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-5xl sm:text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-zinc-300 tracking-wide uppercase">
                        Mog Mockup
                    </h1>
                    <p className="mt-3 text-lg text-zinc-400 tracking-widest uppercase text-sm sm:text-base">
                        SELL THE SHOW, WEAR THE MOMENT
                    </p>
                </header>

                <div className="relative w-full flex justify-end mb-4 -mt-8">
                    <button
                        onClick={() => setIsHistoryOpen(prev => !prev)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800/70 border border-zinc-700 text-zinc-300 rounded-md hover:bg-zinc-700 hover:border-amber-500 transition-all duration-200"
                        aria-haspopup="true"
                        aria-expanded={isHistoryOpen}
                    >
                        <HistoryIcon />
                        <span>History</span>
                    </button>

                    {isHistoryOpen && (
                        <div className="absolute top-full right-0 mt-2 z-10 w-full max-w-md">
                            <HistorySidebar
                                history={history}
                                onItemClick={handleHistoryItemClick}
                                onClearHistory={handleClearHistory}
                                isDisabled={isLoading}
                            />
                        </div>
                    )}
                </div>
                
                <main>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="flex flex-col items-center">
                            <h2 className="text-xl font-semibold mb-4 text-zinc-300">Your Artwork / Logo</h2>
                            <div className="w-full aspect-square bg-zinc-900/50 rounded-lg flex items-center justify-center border-2 border-dashed border-zinc-700/80 overflow-hidden relative shadow-inner">
                                {loadingState === 'uploading' ? (
                                    <div className="flex flex-col items-center text-zinc-400">
                                        <Spinner />
                                        <p className="mt-2">Processing Image...</p>
                                    </div>
                                ) : originalImageBase64 ? (
                                    <img src={originalImageBase64} alt="Original Upload" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="text-center text-zinc-600 cursor-pointer p-4">
                                        <UploadIcon />
                                        <p className="font-semibold">Click to upload artwork</p>
                                        <p className="text-sm">PNG, JPG, WEBP</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    aria-label="Upload original artwork"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <ImageDisplay
                            title="Generated Mockups"
                            imageUrls={editedImages}
                            isLoading={loadingState === 'generating'}
                            loadingMessage={`Fabricating ${numResults} Mockup${numResults > 1 ? 's' : ''}...`}
                            placeholderText="Your mockups will appear here"
                            onDownload={handleDownload}
                        />
                    </div>
                    
                    <div className="bg-zinc-900/50 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-lg border border-zinc-800/50">
                        {error && <p className="text-red-400 mb-4 text-center bg-red-900/50 p-3 rounded-md">{error}</p>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-3 text-center">Number of Mockups</label>
                                <div className="flex justify-center flex-wrap gap-2">
                                    {[1, 2, 3, 4].map(num => (
                                        <button 
                                            key={num} 
                                            onClick={() => setNumResults(num)}
                                            disabled={isLoading}
                                            className={`px-4 py-2 w-12 text-sm font-semibold rounded-full transition-all duration-200 border ${numResults === num ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500 disabled:opacity-50'}`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>
                                <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-3 text-center">Choose Your Style</label>
                                <div className="flex justify-center flex-wrap gap-2">
                                    {styles.map(style => (
                                        <button 
                                            key={style} 
                                            onClick={() => setSelectedStyle(style)}
                                            disabled={isLoading}
                                            className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 border ${selectedStyle === style ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500 disabled:opacity-50'}`}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., On a black t-shirt, worn by a model in a foggy forest"
                                className="w-full flex-grow bg-zinc-800 text-white placeholder-zinc-500 px-4 py-3 rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-200"
                                disabled={isLoading}
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleUndo}
                                    disabled={!canUndo}
                                    title="Undo"
                                    aria-label="Undo last action"
                                    className="p-3 bg-zinc-800 text-zinc-300 rounded-md border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-800"
                                >
                                    <UndoIcon/>
                                </button>
                                <button
                                    onClick={handleRedo}
                                    disabled={!canRedo}
                                    title="Redo"
                                    aria-label="Redo last action"
                                    className="p-3 bg-zinc-800 text-zinc-300 rounded-md border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-800"
                                >
                                    <RedoIcon />
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading || !originalImageFile || !prompt}
                                    className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-500 text-white font-semibold rounded-md shadow-lg shadow-amber-500/20 hover:from-amber-700 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-amber-600 disabled:hover:to-orange-500 transform hover:scale-105"
                                >
                                    {loadingState === 'generating' ? <Spinner /> : <GenerateIcon />}
                                    <span>Generate</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;