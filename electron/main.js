const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs').promises;
const isDev = process.env.NODE_ENV === 'development';
const express = require('express');
const expressApp = express();
const net = require('net');
const http = require('http');

const HISTORY_FILE_PATH = path.join(app.getPath('userData'), 'chat_history.json');
const BOOKMARKS_FILE_PATH = path.join(app.getPath('userData'), 'bookmarks.json');
const LOG_FILE_PATH = path.join(app.getPath('userData'), 'app.log');

let mainWindow = null;
let server = null;

// ログ出力関数
function log(message) {
  const now = new Date();
  const jstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9（日本時間）
  const timestamp = jstDate.toISOString().replace('Z', '+09:00');
  const logMessage = `${timestamp}: ${message}\n`;
  console.log(logMessage);
  fs.appendFile(LOG_FILE_PATH, logMessage)
    .catch(err => console.error('ログファイルの書き込みに失敗しました:', err));
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

// .lspファイルを保存する関数
async function saveLispFile(content) {
  log('saveLispFile関数が呼び出されました');
  try {
    const filename = 'direction2.lsp';
    let lispDir;
    let filePath;
    
    // 開発環境と本番環境でのパス設定
    if (isDev) {
      lispDir = path.join(__dirname, '..', 'lisp_files');
    } else {
      lispDir = path.join(process.resourcesPath, 'lisp_files');
    }
    filePath = path.join(lispDir, filename);
    
    log(`環境: ${isDev ? '開発' : '本番'}`);
    log(`保存先ディレクトリ: ${lispDir}`);
    log(`保存先ファイルパス: ${filePath}`);
    
    // ディレクトリが存在しない場合は作成
    try {
      await fs.mkdir(lispDir, { recursive: true });
      log(`ディレクトリの作成/確認完了: ${lispDir}`);
    } catch (err) {
      log(`ディレクトリの作成中にエラー: ${err.message}`);
      throw err;
    }
    
    // ファイルを上書きモードで保存
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      log(`LSPファイルの保存完了: ${filePath}`);
      log(`ファイルの内容: ${content.substring(0, 100)}...`);
    } catch (err) {
      log(`ファイルの保存中にエラー: ${err.message}`);
      throw err;
    }

    // Pythonスクリプトのパス設定
    let pythonDir;
    let pythonScript;
    
    if (isDev) {
      pythonDir = path.join(__dirname, '..', 'python');
    } else {
      pythonDir = path.join(process.resourcesPath, 'python');
    }
    pythonScript = path.join(pythonDir, 'format_lisp.py');
    
    log(`Pythonディレクトリ: ${pythonDir}`);
    log(`Pythonスクリプト: ${pythonScript}`);

    // Pythonスクリプトの実行
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const command = `cd "${pythonDir}" && ${pythonCmd} "${pythonScript}" "${filePath}"`;
    log(`実行するコマンド: ${command}`);

    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          log(`Pythonスクリプト実行エラー: ${error.message}`);
          log(`コマンド: ${command}`);
          reject({ success: false, error: error.message });
          return;
        }
        
        if (stderr) {
          log(`Python stderr: ${stderr}`);
        }
        
        if (stdout) {
          log(`Python stdout: ${stdout}`);
        }
        
        // ファイルが実際に存在するか確認
        fs.access(filePath)
          .then(() => {
            log(`ファイルの存在を確認: ${filePath}`);
            resolve({ success: true, filePath });
          })
          .catch((err) => {
            log(`ファイルの存在確認でエラー: ${err.message}`);
            reject({ success: false, error: 'ファイルが見つかりません' });
          });
      });
    });
  } catch (error) {
    log(`LSPファイル処理エラー: ${error.message}`);
    log(`エラースタック: ${error.stack}`);
    return { success: false, error: error.message };
  }
}

async function saveHistory(history) {
  try {
    log('履歴を保存します');
    await fs.mkdir(path.dirname(HISTORY_FILE_PATH), { recursive: true });
    await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(history, null, 2), 'utf-8');
    log('履歴を保存しました');
    return { success: true };
  } catch (error) {
    log(`履歴の保存に失敗しました: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function loadHistory() {
  try {
    log(`履歴ファイルを読み込みます: ${HISTORY_FILE_PATH}`);
    const data = await fs.readFile(HISTORY_FILE_PATH, 'utf-8');
    const parsedData = JSON.parse(data);
    log('履歴データを読み込みました');
    return { success: true, data: parsedData };
  } catch (error) {
    log(`履歴の読み込みに失敗しました: ${error.message}`);
    if (error.code === 'ENOENT') {
      log('履歴ファイルが存在しないため、空の配列を返します');
      return { success: true, data: [] };
    }
    return { success: false, error: error.message };
  }
}

async function saveBookmarks(bookmarks) {
  try {
    log('ブックマークを保存します');
    await fs.mkdir(path.dirname(BOOKMARKS_FILE_PATH), { recursive: true });
    await fs.writeFile(BOOKMARKS_FILE_PATH, JSON.stringify(bookmarks, null, 2), 'utf-8');
    log('ブックマークを保存しました');
    return { success: true };
  } catch (error) {
    log(`ブックマークの保存に失敗しました: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function loadBookmarks() {
  try {
    log(`ブックマークファイルを読み込みます: ${BOOKMARKS_FILE_PATH}`);
    const data = await fs.readFile(BOOKMARKS_FILE_PATH, 'utf-8');
    const parsedData = JSON.parse(data);
    log('ブックマークデータを読み込みました');
    return { success: true, data: parsedData };
  } catch (error) {
    log(`ブックマークの読み込みに失敗しました: ${error.message}`);
    if (error.code === 'ENOENT') {
      log('ブックマークファイルが存在しないため、空の配列を返します');
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

      // ウィンドウがアクティブになったときの処理
      mainWindow.on('focus', () => {
        mainWindow.setTitle('AutoCAD Assistant（Active）');
        // 入力ボックスにフォーカスを移動
        mainWindow.webContents.send('focus-input');
      });

      // ウィンドウが非アクティブになったときの処理
      mainWindow.on('blur', () => {
        mainWindow.setTitle('AutoCAD Assistant');
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

    if (isDev) {
      log('Opening DevTools in development mode');
      mainWindow.webContents.openDevTools();
    }

    mainWindow.webContents.on('did-finish-load', () => {
      log('Window content finished loading');
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      log(`Failed to load window content: ${errorDescription} (${errorCode})`);
    });
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

// 前面固定の制御
ipcMain.handle('set-always-on-top', async (event, value) => {
  try {
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(value);
      log(`ウィンドウの前面固定を${value ? '有効' : '無効'}にしました`);
      return { success: true };
    }
    return { success: false, error: 'メインウィンドウが見つかりません' };
  } catch (error) {
    log(`前面固定の設定中にエラーが発生しました: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// シングルインスタンスロック
const gotTheLock = app.requestSingleInstanceLock();

// コマンドライン引数を処理する関数
function processCommandLineArgs() {
  const args = process.argv.slice(1);
  // 開発環境では最初の引数が'.'になるため、それをスキップ
  const startIndex = isDev ? 2 : 1;
  const selectedObjectCount = args[startIndex];
  const count = selectedObjectCount ? parseInt(selectedObjectCount, 10) : null;
  
  if (count !== null) {
    log(`AutoCADから選択オブジェクト数を受信: ${count}`);
  }
  return count;
}

if (!gotTheLock) {
  // 既存のインスタンスが実行中の場合は、新しいインスタンスを終了
  app.quit();
} else {
  app.on('second-instance', () => {
    // 2つ目のインスタンスが起動された場合、既存のウィンドウにフォーカス
    const existingWindow = BrowserWindow.getAllWindows()[0];
    if (existingWindow) {
      if (existingWindow.isMinimized()) {
        existingWindow.restore();
      }
      existingWindow.focus();
    }
  });

  // アプリケーションの起動処理
  app.whenReady().then(async () => {
    try {
      // コマンドライン引数を処理
      const selectedObjectCount = processCommandLineArgs();
      
      // 既存のウィンドウがある場合はそれをフォーカス
      const existingWindow = BrowserWindow.getAllWindows()[0];
      if (existingWindow) {
        if (existingWindow.isMinimized()) {
          existingWindow.restore();
        }
        existingWindow.focus();
        // 既存のウィンドウに新しい選択オブジェクト数を送信
        if (selectedObjectCount !== null) {
          log(`既存のウィンドウに選択オブジェクト数を送信: ${selectedObjectCount}`);
          existingWindow.webContents.send('selected-objects-count', selectedObjectCount);
        }
        return;
      }

      // 新しいウィンドウを作成
      await initializeDataDirectories();
      const startUrl = await startServer();
      await createWindow(startUrl);
      
      // 新しいウィンドウに選択オブジェクト数を送信
      if (selectedObjectCount !== null && mainWindow) {
        mainWindow.webContents.on('did-finish-load', () => {
          log(`新しいウィンドウに選択オブジェクト数を送信: ${selectedObjectCount}`);
          mainWindow.webContents.send('selected-objects-count', selectedObjectCount);
        });
      }
    } catch (err) {
      // エラーログのみ記録し、エラーダイアログは表示しない
      log(`Application error: ${err.message}`);
      app.quit();
    }
  });

  // アプリケーションの再起動をハンドリング
  app.on('activate', async () => {
    try {
      // 既存のウィンドウがある場合はそれをフォーカス
      const existingWindow = BrowserWindow.getAllWindows()[0];
      if (existingWindow) {
        if (existingWindow.isMinimized()) {
          existingWindow.restore();
        }
        existingWindow.focus();
        return;
      }

      // 新しいウィンドウを作成
      const startUrl = await startServer();
      await createWindow(startUrl);
    } catch (err) {
      // エラーログのみ記録
      log(`Activation error: ${err.message}`);
    }
  });
}

// エラーハンドリング
process.on('uncaughtException', (error) => {
  // エラーログのみ記録し、エラーダイアログは表示しない
  log(`Uncaught Exception: ${error.message}`);
  if (!BrowserWindow.getAllWindows().length) {
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (server) {
      server.close(() => {
        app.quit();
      });
    } else {
      app.quit();
    }
  }
});

// アプリケーション終了時の処理
app.on('will-quit', () => {
  log('Application is shutting down');
});
