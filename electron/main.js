const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const isDev = process.env.NODE_ENV === 'development';
const express = require('express');
const expressApp = express();
const net = require('net');
const http = require('http');

const HISTORY_FILE_PATH = path.join(__dirname, '..', 'data', 'chat_history.json');
const BOOKMARKS_FILE_PATH = path.join(__dirname, '..', 'data', 'bookmarks.json');
const LOG_FILE_PATH = path.join(app.getPath('userData'), 'app.log');

let mainWindow = null;
let server = null;

// ログ出力関数
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  console.log(logMessage);
  fs.appendFile(LOG_FILE_PATH, logMessage).catch(err => console.error('Failed to write to log file:', err));
}

// ポートが使用可能かチェック
async function findAvailablePort(startPort) {
  const isPortAvailable = (port) => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      server.listen(port);
    });
  };

  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port++;
  }
  return port;
}

// サーバーが応答するまで待機
async function waitForServer(url, maxRetries = 30) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const checkServer = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      }).on('error', retry);
    };

    const retry = () => {
      retries++;
      if (retries >= maxRetries) {
        reject(new Error('Server did not respond'));
        return;
      }
      setTimeout(checkServer, 1000);
    };

    checkServer();
  });
}

// 初期化時にデータディレクトリを作成
async function initializeDataDirectories() {
  try {
    await fs.mkdir(path.join(__dirname, '..', 'data'), { recursive: true });
    console.log('データディレクトリを作成しました');
    
    // 履歴ファイルが存在しない場合は空の配列で初期化
    try {
      await fs.access(HISTORY_FILE_PATH);
    } catch {
      await fs.writeFile(HISTORY_FILE_PATH, '[]', 'utf-8');
      console.log('履歴ファイルを初期化しました');
    }
    
    // ブックマークファイルが存在しない場合は空の配列で初期化
    try {
      await fs.access(BOOKMARKS_FILE_PATH);
    } catch {
      await fs.writeFile(BOOKMARKS_FILE_PATH, '[]', 'utf-8');
      console.log('ブックマークファイルを初期化しました');
    }
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
  return new Promise(async (resolve, reject) => {
    try {
      if (isDev) {
        log('Development mode: Using Next.js dev server');
        const port = 3000;
        const url = `http://localhost:${port}`;
        try {
          await waitForServer(url);
          log('Next.js server is ready');
          resolve(url);
        } catch (err) {
          log(`Failed to connect to Next.js server: ${err.message}`);
          reject(err);
        }
        return;
      }

      // 本番環境のパスを設定
      let distPath;
      try {
        distPath = path.join(app.getAppPath(), 'dist', 'app');
        // パスが存在するか確認
        await fs.access(distPath);
        log(`Production static files path exists: ${distPath}`);
      } catch (err) {
        log(`Failed to access dist path: ${err.message}`);
        log('Falling back to resource path');
        distPath = path.join(process.resourcesPath, 'app');
        try {
          await fs.access(distPath);
        } catch (err) {
          log(`Failed to access resource path: ${err.message}`);
          throw new Error(`静的ファイルのパスが見つかりません: ${distPath}`);
        }
      }

      log(`Using static files path: ${distPath}`);

      // 静的ファイルの提供設定
      expressApp.use(express.static(distPath));
      expressApp.use(express.json());

      // すべてのルートでindex.htmlを返す
      expressApp.get('*', (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        log(`Serving index.html from: ${indexPath}`);
        res.sendFile(indexPath);
      });

      // 利用可能なポートを見つけて起動
      const port = await findAvailablePort(3000);
      server = expressApp.listen(port, 'localhost', () => {
        const url = `http://localhost:${port}`;
        log(`Production server is running on ${url}`);
        resolve(url);
      });

      server.on('error', (err) => {
        log(`Server error: ${err.message}`);
        reject(err);
      });
    } catch (err) {
      log(`Failed to start server: ${err.message}`);
      reject(err);
    }
  });
}

async function createWindow(startUrl) {
  try {
    if (!mainWindow) {
      log('Creating new BrowserWindow');
      mainWindow = new BrowserWindow({
        width: 950,
        height: 730,
        resizable: false,
        autoHideMenuBar: true,
        title: 'AutoCAD Assistant',
        icon: path.join(process.resourcesPath, 'public', 'images', 'icon', 'icon.ico'),
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js')
        }
      });

      mainWindow.on('closed', () => {
        log('Main window closed');
        mainWindow = null;
        if (server) {
          server.close(() => {
            log('Server closed');
          });
        }
      });
    }

    log(`Loading URL: ${startUrl}`);
    await mainWindow.loadURL(startUrl);
    log('Window loaded successfully');

    // デバッグ用：開発者ツールを開く
    if (isDev) {
      log('Opening DevTools in development mode');
      mainWindow.webContents.openDevTools();
    }
  } catch (err) {
    log(`Failed to create/load window: ${err.message}`);
    log(`Error stack: ${err.stack}`);
    if (isDev) {
      log('Retrying in development mode...');
      setTimeout(() => createWindow(startUrl), 3000);
    } else {
      throw err;
    }
  }
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
    log('Initializing application...');
    log(`App path: ${app.getAppPath()}`);
    log(`Resource path: ${process.resourcesPath}`);
    log(`Is Development: ${isDev}`);
    
    await initializeDataDirectories();
    
    log('Starting server...');
    const startUrl = await startServer();
    
    log('Creating window...');
    await createWindow(startUrl);
    
    log('Application started successfully');
  } catch (err) {
    log(`Failed to initialize application: ${err.message}`);
    log(`Stack trace: ${err.stack}`);
    dialog.showErrorBox('起動エラー',
      'アプリケーションの起動中にエラーが発生しました。\n' +
      `エラー詳細: ${err.message}\n` +
      `ログファイルを確認してください: ${LOG_FILE_PATH}`
    );
    app.quit();
  }
});

// 開発モードの場合、アプリケーションの再起動をハンドリング
if (isDev) {
  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      log('Reactivating application in development mode');
      const startUrl = await startServer();
      await createWindow(startUrl);
    }
  });
}

// エラーハンドリング
process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`);
  log(`Stack trace: ${error.stack}`);
  dialog.showErrorBox('予期せぬエラー',
    'アプリケーションで予期せぬエラーが発生しました。\n' +
    `エラー詳細: ${error.message}\n` +
    `ログファイルを確認してください: ${LOG_FILE_PATH}`
  );
  app.quit();
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
