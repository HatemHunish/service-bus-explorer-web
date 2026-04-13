import { app, BrowserWindow, shell, dialog } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as net from 'net';

let mainWindow: BrowserWindow | null = null;
let apiProcess: ChildProcess | null = null;
let apiPort: number | null = null;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
  });
}

function waitForPort(port: number, timeout = 30_000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const socket = net.createConnection(port, '127.0.0.1');
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - start >= timeout) {
          reject(new Error(`API did not start within ${timeout}ms`));
        } else {
          setTimeout(check, 250);
        }
      });
    };
    check();
  });
}

async function startApi(port: number): Promise<void> {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'connections.sqlite');

  const apiMain = app.isPackaged
    ? path.join(process.resourcesPath, 'api', 'dist', 'main.js')
    : path.join(__dirname, '..', '..', 'api', 'dist', 'main.js');

  const staticPath = app.isPackaged
    ? path.join(process.resourcesPath, 'web')
    : undefined;

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    // Make Electron binary behave as pure Node.js
    ELECTRON_RUN_AS_NODE: '1',
    API_PORT: String(port),
    DATABASE_PATH: dbPath,
    NODE_ENV: 'production',
    // Allow all origins in desktop mode (same-machine localhost)
    CORS_ORIGIN: '*',
  };

  if (staticPath) {
    env.STATIC_PATH = staticPath;
  }

  apiProcess = spawn(process.execPath, [apiMain], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  apiProcess.stdout?.on('data', (d: Buffer) =>
    console.log('[API]', d.toString().trimEnd()),
  );
  apiProcess.stderr?.on('data', (d: Buffer) =>
    console.error('[API]', d.toString().trimEnd()),
  );

  apiProcess.on('exit', (code) => {
    console.log('API process exited with code:', code);
    if (code !== 0 && mainWindow) {
      dialog.showErrorBox(
        'API Error',
        'The backend server stopped unexpectedly. Please restart the app.',
      );
    }
  });

  await waitForPort(port);
  console.log(`API ready on port ${port}`);
}

async function createWindow(port: number): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    title: 'Service Bus Explorer',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  // Open external links in the default browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (app.isPackaged) {
    await mainWindow.loadURL(`http://localhost:${port}`);
  } else {
    // In dev, Vite serves the web app with HMR. The API runs separately via
    // `pnpm api:dev` on port 3002, which Vite proxies automatically.
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    if (app.isPackaged) {
      // Production: start the bundled API on a free port, serve web from it
      apiPort = await findFreePort();
      await startApi(apiPort);
      await createWindow(apiPort);
    } else {
      // Dev: expect `pnpm api:dev` (port 3002) and `pnpm web:dev` (port 5173)
      // to already be running. Just open the Electron window.
      await createWindow(3002);
    }
  } catch (err) {
    dialog.showErrorBox('Startup Error', String(err));
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', async () => {
  if (mainWindow === null && apiPort !== null) {
    await createWindow(apiPort);
  }
});

app.on('before-quit', () => {
  apiProcess?.kill();
});
