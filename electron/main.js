const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const isDev = process.env.NODE_ENV !== 'production';

// Pythonスクリプトを実行して.lspファイルを保存する関数
async function saveLispFile(content) {
  try {
    const filename = 'direction.lsp';
    const filePath = path.join(__dirname, '..', 'lisp_files', filename);
    
    console.log('保存先ディレクトリ:', path.join(__dirname, '..', 'lisp_files'));
    console.log('保存先ファイルパス:', filePath);
    
    // ディレクトリが存在しない場合は作成
    await fs.mkdir(path.join(__dirname, '..', 'lisp_files'), { recursive: true });
    
    // ファイルを上書きモードで保存
    await fs.writeFile(filePath, content, 'utf-8');
    console.log('ファイル保存成功:', filePath);
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving lisp file:', error);
    return { success: false, error: error.message };
  }
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 950,
    height: 730,
    resizable: false,
    autoHideMenuBar: true,
    title: 'AutoCAD Assistant',
    icon: path.join(__dirname, '..', 'public', 'images', 'icon', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../.next/server/pages/index.html')}`;
    
  console.log('Loading URL:', startUrl);

  if (isDev) {
    const loadURL = async () => {
      try {
        await mainWindow.loadURL(startUrl);
        console.log('Window loaded successfully');
      } catch (err) {
        console.log('Failed to connect to Next.js server, retrying...', err);
        setTimeout(loadURL, 1000);
      }
    };
    loadURL();
  } else {
    mainWindow.loadURL(startUrl);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPCハンドラーの設定
ipcMain.handle('save-lisp-file', async (event, content) => {
  return await saveLispFile(content);
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
