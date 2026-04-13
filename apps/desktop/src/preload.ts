import { contextBridge } from 'electron';

// Expose a flag so the web app knows it's running inside Electron.
// The web app uses this to derive the correct WebSocket URL from
// window.location.origin instead of a baked-in VITE_ env variable.
contextBridge.exposeInMainWorld('__ELECTRON__', true);
