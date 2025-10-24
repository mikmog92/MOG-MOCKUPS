export interface ImageFile {
  file: File;
  base64: string;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  style: string;
  originalImageUrl: string;
  editedImageUrls: string[];
}