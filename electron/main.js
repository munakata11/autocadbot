const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const isDev = process.env.NODE_ENV !== 'production';

const HISTORY_FILE_PATH = path.join(__dirname, '..', 'data', 'chat_history.json');
const BOOKMARKS_FILE_PATH = path.join(__dirname, '..', 'data', 'bookmarks.json');

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

app.whenReady().then(async () => {
  await initializeDataDirectories();
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
