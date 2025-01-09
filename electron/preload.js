const { contextBridge, ipcRenderer } = require('electron');

// レンダラープロセスで使用可能なAPIを定義
contextBridge.exposeInMainWorld('electron', {
  // 必要なメソッドをここに追加
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  invoke: (channel, data) => {
    return ipcRenderer.invoke(channel, data);
  }
}); 