const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';
let mainWindow = null;
let isQuitting = false;

async function confirmAndQuit(parentWindow) {
  const choice = await dialog.showMessageBox(parentWindow || mainWindow, {
    type: 'question',
    buttons: ['Cancel', 'Exit Application'],
    defaultId: 0,
    cancelId: 0,
    title: 'Exit DineDeck Partner POS & KDS',
    message: 'Are you sure you want to exit DineDeck?',
    detail: 'Active orders, kitchen KDS tickets, and billing sessions will continue running on the server. Confirm to exit the Partner POS application.',
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
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'DineDeck Partner POS & KDS',
    backgroundColor: '#0F172A',
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

  // Load the production build of partner-web or dev server
  const distPath = path.join(__dirname, '..', 'partner-web', 'dist', 'index.html');
  if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Global error logger
  mainWindow.webContents.on('render-process-gone', (event, detailed) => {
    console.error('Partner app renderer crashed:', detailed.reason);
  });
}

// 🖨️ Thermal Printer IPC Handlers
ipcMain.handle('printer:get-printers', async () => {
  if (!mainWindow) return [];
  return await mainWindow.webContents.getPrintersAsync();
});

ipcMain.handle('printer:print-receipt', async (event, { html, printerName, silent = false }) => {
  try {
    const printWindow = new BrowserWindow({
      show: false,
      width: 320,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const styledHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body {
            margin: 0;
            padding: 8px;
            font-family: 'Courier New', Courier, monospace;
            background: #fff;
            color: #000;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(styledHtml)}`);

    const options = {
      silent: silent,
      printBackground: true,
      deviceName: printerName || undefined,
      margins: { marginType: 'none' }
    };

    return new Promise((resolve) => {
      printWindow.webContents.print(options, (success, errorType) => {
        printWindow.close();
        if (!success) {
          console.warn('Thermal print failed:', errorType);
          resolve({ success: false, error: errorType });
        } else {
          resolve({ success: true });
        }
      });
    });
  } catch (err) {
    console.error('Print handler exception:', err);
    return { success: false, error: err.message };
  }
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

// App lifecycle
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
