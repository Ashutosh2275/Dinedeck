const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let isQuitting = false;

async function confirmAndQuit(parentWindow) {
  const choice = await dialog.showMessageBox(parentWindow || mainWindow, {
    type: 'question',
    buttons: ['Cancel', 'Exit Control Center'],
    defaultId: 0,
    cancelId: 0,
    title: 'Exit DineDeck Control Center',
    message: 'Are you sure you want to exit the Super Admin Control Center?',
    detail: 'Platform activity, restaurant connections, and background operations will continue running.',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    noLink: true
  });

  if (choice.response === 1) {
    isQuitting = true;
    app.quit();
    return true;
  }
  return false;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    width: 1520,
    height: 950,
    minWidth: 1024,
    minHeight: 720,
    title: 'DineDeck Super Admin Control Center',
    backgroundColor: '#F8FAFC',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    autoHideMenuBar: true,
    kiosk: false, // Maintain full Windows system accessibility & Alt+Tab
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  // Ensure true borderless maximized full-screen presentation
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setFullScreen(true);
  mainWindow.maximize();

  // Intercept Alt+F4 and close event for professional exit confirmation
  mainWindow.on('close', async (e) => {
    if (isQuitting) return;
    e.preventDefault();
    await confirmAndQuit(mainWindow);
  });

  // Support F11 keyboard shortcut to toggle full-screen presentation
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      const willBeFullScreen = !mainWindow.isFullScreen();
      mainWindow.setFullScreen(willBeFullScreen);
      event.preventDefault();
    }
  });

  const localDistPath = path.join(__dirname, 'dist', 'index.html');
  const siblingDistPath = path.join(__dirname, '..', 'admin-web', 'dist', 'index.html');

  if (fs.existsSync(localDistPath)) {
    mainWindow.loadFile(localDistPath);
  } else if (fs.existsSync(siblingDistPath)) {
    mainWindow.loadFile(siblingDistPath);
  } else {
    mainWindow.loadURL('http://localhost:5175');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('render-process-gone', (event, detailed) => {
    console.error('Admin control center renderer crashed:', detailed.reason);
  });

  // Prompt user for file path whenever a file download is triggered
  mainWindow.webContents.session.on('will-download', (event, item) => {
    const defaultName = item.getFilename();
    const defaultPath = path.join(app.getPath('documents'), defaultName);
    item.setSaveDialogOptions({
      title: 'DineDeck Control Center — Save File Location',
      defaultPath: defaultPath
    });
  });
}

// 📁 File Path & Storage IPC Handlers
ipcMain.handle('file:save-file', async (event, { defaultName, data, filters }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'DineDeck Control Center — Choose Save File Location',
    defaultPath: path.join(app.getPath('documents'), defaultName || 'dinedeck_admin_export.csv'),
    buttonLabel: 'Save File',
    filters: filters || [
      { name: 'Spreadsheets & Data (*.csv)', extensions: ['csv'] },
      { name: 'All Files (*.*)', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    try {
      fs.writeFileSync(result.filePath, data, 'utf-8');
      return { success: true, filePath: result.filePath };
    } catch (err) {
      console.error('Failed to write file to chosen path:', err);
      return { success: false, error: err.message };
    }
  }
  return { canceled: true };
});

ipcMain.handle('file:choose-path', async (event, { title, defaultPath }) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: title || 'DineDeck Control Center — Select Storage Folder',
    defaultPath: defaultPath || app.getPath('documents'),
    properties: ['openDirectory', 'createDirectory']
  });

  if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
    return { success: true, path: result.filePaths[0] };
  }
  return { canceled: true };
});

// App Controls IPC Handlers
ipcMain.handle('app:exit', async () => {
  return await confirmAndQuit(mainWindow);
});

ipcMain.handle('app:toggle-fullscreen', () => {
  if (mainWindow) {
    const next = !mainWindow.isFullScreen();
    mainWindow.setFullScreen(next);
    return next;
  }
  return false;
});

ipcMain.handle('app:is-fullscreen', () => {
  return mainWindow ? mainWindow.isFullScreen() : true;
});

app.whenReady().then(createWindow);

app.on('before-quit', (e) => {
  if (!isQuitting) {
    e.preventDefault();
    confirmAndQuit(mainWindow);
  }
});

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
