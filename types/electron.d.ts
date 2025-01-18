declare global {
  interface Window {
    electron: {
      saveLispFile: (content: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      saveHistory: (history: any[]) => Promise<{ success: boolean; error?: string }>;
      loadHistory: () => Promise<{ success: boolean; data: any[]; error?: string }>;
      saveBookmarks: (bookmarks: any[]) => Promise<{ success: boolean; error?: string }>;
      loadBookmarks: () => Promise<{ success: boolean; data: any[]; error?: string }>;
      setAlwaysOnTop: (value: boolean) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

export {}; 