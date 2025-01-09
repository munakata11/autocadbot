const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  const win = new BrowserWindow({
    width: 950,
    height: 730,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    }
  });

  const url = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../.next/server/pages/index.html')}`;
    
  if (isDev) {
    const loadURL = async () => {
      try {
        await win.loadURL(url);
      } catch (err) {
        console.log('Next.jsサーバーに接続できません。再試行します...');
        setTimeout(loadURL, 1000);
      }
    };
    loadURL();
  } else {
    win.loadURL(url);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
