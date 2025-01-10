const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const isDev = process.env.NODE_ENV !== 'production';
const express = require('express');
const expressApp = express();

// 本番環境とdev環境でのベースパスを設定
const getBasePath = () => {
  return isDev ? path.join(__dirname, '..') : process.resourcesPath;
};

const HISTORY_FILE_PATH = path.join(getBasePath(), 'data', 'chat_history.json');
const BOOKMARKS_FILE_PATH = path.join(getBasePath(), 'data', 'bookmarks.json');

let mainWindow = null;
let server = null;

// 初期化時にデータディレクトリを作成
async function initializeDataDirectories() {
  try {
    const dataDir = path.join(getBasePath(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    console.log('データディレクトリを作成しました:', dataDir);
    
    // 履歴ファイルが存在しない場合は空の配列で初期化
    try {
      await fs.access(HISTORY_FILE_PATH);
      console.log('履歴ファイルが存在します:', HISTORY_FILE_PATH);
    } catch {
      await fs.writeFile(HISTORY_FILE_PATH, '[]', 'utf-8');
      console.log('履歴ファイルを初期化しました:', HISTORY_FILE_PATH);
    }
    
    // ブックマークファイルが存在しない場合は空の配列で初期化
    try {
      await fs.access(BOOKMARKS_FILE_PATH);
      console.log('ブックマークファイルが存在します:', BOOKMARKS_FILE_PATH);
    } catch {
      await fs.writeFile(BOOKMARKS_FILE_PATH, '[]', 'utf-8');
      console.log('ブックマークファイルを初期化しました:', BOOKMARKS_FILE_PATH);
    }

    // LSPファイル用のディレクトリも作成
    const lispDir = path.join(getBasePath(), 'lisp_files');
    await fs.mkdir(lispDir, { recursive: true });
    console.log('LSPディレクトリを作成しました:', lispDir);
  } catch (error) {
    console.error('データディレクトリの初期化に失敗しました:', error);
  }
}

// Pythonスクリプトを実行して.lspファイルを保存する関数
async function saveLispFile(content) {
  try {
    const filename = 'direction.lsp';
    // 本番環境とdev環境でのパスを分岐
    const basePath = isDev 
      ? path.join(__dirname, '..') 
      : process.resourcesPath;
    
    const lispDir = path.join(basePath, 'lisp_files');
    const filePath = path.join(lispDir, filename);
    
    console.log('保存先ディレクトリ:', lispDir);
    console.log('保存先ファイルパス:', filePath);
    
    // ディレクトリが存在しない場合は作成
    await fs.mkdir(lispDir, { recursive: true });
    
    // ファイルを上書きモードで保存
    await fs.writeFile(filePath, content, 'utf-8');
    console.log('ファイル保存成功:', filePath);
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving lisp file:', error);
    return { success: false, error: error.message };
  }
}

async function saveHistory(history) {
  try {
    console.log('履歴を保存します:', history);
    await fs.mkdir(path.dirname(HISTORY_FILE_PATH), { recursive: true });
    await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(history, null, 2), 'utf-8');
    console.log('履歴を保存しました');
    return { success: true };
  } catch (error) {
    console.error('履歴の保存に失敗しました:', error);
    return { success: false, error: error.message };
  }
}

async function loadHistory() {
  try {
    console.log('履歴ファイルを読み込みます:', HISTORY_FILE_PATH);
    const data = await fs.readFile(HISTORY_FILE_PATH, 'utf-8');
    const parsedData = JSON.parse(data);
    console.log('履歴データを読み込みました:', parsedData);
    return { success: true, data: parsedData };
  } catch (error) {
    console.error('履歴の読み込みに失敗しました:', error);
    if (error.code === 'ENOENT') {
      console.log('履歴ファイルが存在しないため、空の配列を返します');
      return { success: true, data: [] };
    }
    return { success: false, error: error.message };
  }
}

async function saveBookmarks(bookmarks) {
  try {
    console.log('ブックマークを保存します:', bookmarks);
    await fs.mkdir(path.dirname(BOOKMARKS_FILE_PATH), { recursive: true });
    await fs.writeFile(BOOKMARKS_FILE_PATH, JSON.stringify(bookmarks, null, 2), 'utf-8');
    console.log('ブックマークを保存しました');
    return { success: true };
  } catch (error) {
    console.error('ブックマークの保存に失敗しました:', error);
    return { success: false, error: error.message };
  }
}

async function loadBookmarks() {
  try {
    console.log('ブックマークファイルを読み込みます:', BOOKMARKS_FILE_PATH);
    const data = await fs.readFile(BOOKMARKS_FILE_PATH, 'utf-8');
    const parsedData = JSON.parse(data);
    console.log('ブックマークデータを読み込みました:', parsedData);
    return { success: true, data: parsedData };
  } catch (error) {
    console.error('ブックマークの読み込みに失敗しました:', error);
    if (error.code === 'ENOENT') {
      console.log('ブックマークファイルが存在しないため、空の配列を返します');
      return { success: true, data: [] };
    }
    return { success: false, error: error.message };
  }
}

async function startServer() {
  return new Promise((resolve, reject) => {
    try {
      // 本番環境のパスを設定
      const distPath = isDev ? path.join(__dirname, '..', 'dist', 'app') : path.join(process.resourcesPath, 'app');
      console.log('Static files path:', distPath);

      // 静的ファイルの提供設定
      expressApp.use(express.static(distPath));
      expressApp.use(express.json());

      // すべてのルートでindex.htmlを返す
      expressApp.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });

      // サーバーを起動
      server = expressApp.listen(3000, 'localhost', () => {
        console.log('Server is running on http://localhost:3000');
        resolve();
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log('Port 3000 is already in use. Trying to close existing server...');
          require('tcp-port-used').check(3000, 'localhost')
            .then(inUse => {
              if (inUse) {
                console.log('Attempting to close existing connection...');
                server.close();
                startServer().then(resolve).catch(reject);
              }
            });
        } else {
          console.error('Server error:', err);
          reject(err);
        }
      });
    } catch (err) {
      console.error('Failed to start server:', err);
      reject(err);
    }
  });
}

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

  // 開発者ツールを常に開く
  mainWindow.webContents.openDevTools();

  // サーバーが起動するまで待ってからウィンドウを読み込む
  const loadWindow = async () => {
    try {
      await mainWindow.loadURL('http://localhost:3000');
      console.log('Window loaded successfully');
    } catch (err) {
      console.error('Failed to load window:', err);
      setTimeout(loadWindow, 1000); // 1秒後に再試行
    }
  };

  loadWindow();

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (server) {
      server.close(() => {
        console.log('Server closed');
      });
    }
  });
}

// IPCハンドラーの設定
ipcMain.handle('save-lisp-file', async (event, content) => {
  return await saveLispFile(content);
});

ipcMain.handle('save-history', async (event, history) => {
  return await saveHistory(history);
});

ipcMain.handle('load-history', async () => {
  return await loadHistory();
});

ipcMain.handle('save-bookmarks', async (event, bookmarks) => {
  return await saveBookmarks(bookmarks);
});

ipcMain.handle('load-bookmarks', async () => {
  return await loadBookmarks();
});

// アプリケーションの起動処理
app.whenReady().then(async () => {
  try {
    await initializeDataDirectories();
    await startServer();
    createWindow();
  } catch (err) {
    console.error('Failed to initialize application:', err);
    app.quit();
  }

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (server) {
      server.close(() => {
        console.log('Server closed');
        app.quit();
      });
    } else {
      app.quit();
    }
  }
});
