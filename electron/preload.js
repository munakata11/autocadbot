const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  invoke: (channel, data) => {
    return ipcRenderer.invoke(channel, data);
  },
  saveLispFile: (content) => {
    return ipcRenderer.invoke('save-lisp-file', content);
  },
  saveHistory: (history) => {
    return ipcRenderer.invoke('save-history', history);
  },
  loadHistory: () => {
    return ipcRenderer.invoke('load-history');
  },
  saveBookmarks: (bookmarks) => {
    return ipcRenderer.invoke('save-bookmarks', bookmarks);
  },
  loadBookmarks: () => {
    return ipcRenderer.invoke('load-bookmarks');
  }
}); 