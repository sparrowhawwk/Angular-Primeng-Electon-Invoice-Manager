import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception in Main Process:', error);
});

let win: BrowserWindow | null = null;
const args = process.argv.slice(1);
const serve = args.some((val) => val === '--serve');

if (serve) {
    try {
        const electronDebug = require('electron-debug');
        if (typeof electronDebug === 'function') {
            electronDebug();
        } else if (electronDebug && typeof electronDebug.default === 'function') {
            electronDebug.default();
        }
    } catch (err) {
        console.error('Failed to initialize electron-debug:', err);
    }

    try {
        const reloader = require('electron-reloader');
        if (typeof reloader === 'function') {
            reloader(module);
        } else if (reloader && typeof reloader.default === 'function') {
            reloader.default(module);
        }
    } catch (err) {
        console.error('Failed to initialize electron-reloader:', err);
    }
}

function createWindow(): BrowserWindow {
    const electronScreen = screen;
    const size = electronScreen.getPrimaryDisplay().workAreaSize;

    // Create the browser window.
    win = new BrowserWindow({
        x: 0,
        y: 0,
        width: size.width,
        height: size.height,
        webPreferences: {
            nodeIntegration: true,
            allowRunningInsecureContent: serve,
            contextIsolation: false,
        },
    });

    if (serve) {
        win.loadURL('http://localhost:4200');
    } else {
        // Path when running electron executable
        let pathIndex = './index.html';

        if (fs.existsSync(path.join(__dirname, '../dist/invoice-manager/browser/index.html'))) {
            // Path when running electron in local folder
            pathIndex = '../dist/invoice-manager/browser/index.html';
        }

        const urlPath = url.format({
            pathname: path.join(__dirname, pathIndex),
            protocol: 'file:',
            slashes: true,
        });

        win.loadURL(urlPath);
    }

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object
        win = null;
    });

    return win;
}

try {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    app.on('ready', () => {
        // Added delay to fix issue on some Windows 10 machines
        setTimeout(createWindow, 400);
    });

    // Quit when all windows are closed.
    app.on('window-all-closed', () => {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        // On macOS, it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (win === null) {
            createWindow();
        }
    });

    app.on('before-quit', () => {
        // Cleanup any remaining resources if necessary
    });

    ipcMain.handle('save-company-info', async (event, data) => {
        try {
            const userDataPath = app.getPath('userData');
            if (!fs.existsSync(userDataPath)) {
                fs.mkdirSync(userDataPath, { recursive: true });
            }
            const filePath = path.join(userDataPath, 'company-info.json');
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return { success: true };
        } catch (error) {
            console.error('Error saving company info:', error);
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('get-company-info', async (event) => {
        try {
            const userDataPath = app.getPath('userData');
            const filePath = path.join(userDataPath, 'company-info.json');
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            console.error('Error getting company info:', error);
            return null;
        }
    });

    // Move IPC handlers into app.on('ready') block or ensure they are registered early
    // Actually, top level is usually fine, but let's add a log that they are registered.
    console.log('Main: IPC handlers registered');
    ipcMain.handle('get-contacts', async (event, options?: { globalFilter?: string, first?: number, rows?: number }) => {
        try {
            const userDataPath = app.getPath('userData');
            const filePath = path.join(userDataPath, 'contacts.json');
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                let contacts: any[] = JSON.parse(data);

                // filtering
                if (options?.globalFilter) {
                    const filterValue = options.globalFilter.toLowerCase();
                    contacts = contacts.filter(c =>
                        (c.name && c.name.toLowerCase().includes(filterValue)) ||
                        (c.email && c.email.toLowerCase().includes(filterValue)) ||
                        (c.phone && c.phone.toLowerCase().includes(filterValue)) ||
                        (c.gstin && c.gstin.toLowerCase().includes(filterValue))
                    );
                }

                const totalRecords = contacts.length;

                // pagination
                if (options?.first !== undefined && options?.rows !== undefined) {
                    contacts = contacts.slice(options.first, options.first + options.rows);
                }

                return { data: contacts, totalRecords };
            }
            return { data: [], totalRecords: 0 };
        } catch (error) {
            console.error('Error getting contacts:', error);
            return { data: [], totalRecords: 0 };
        }
    });

    ipcMain.handle('save-contact', async (event, contact) => {
        try {
            const userDataPath = app.getPath('userData');
            if (!fs.existsSync(userDataPath)) {
                fs.mkdirSync(userDataPath, { recursive: true });
            }
            const filePath = path.join(userDataPath, 'contacts.json');
            let contacts: any[] = [];
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                contacts = JSON.parse(data);
            }

            if (contact.id) {
                // Update existing
                const index = contacts.findIndex(c => c.id === contact.id);
                if (index !== -1) {
                    contacts[index] = { ...contact };
                } else {
                    return { success: false, error: 'Contact not found' };
                }
            } else {
                // Create new
                contacts.push({ ...contact, id: Date.now() });
            }

            fs.writeFileSync(filePath, JSON.stringify(contacts, null, 2));
            return { success: true };
        } catch (error) {
            console.error('Error saving contact:', error);
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('delete-contact', async (event, id) => {
        try {
            const userDataPath = app.getPath('userData');
            const filePath = path.join(userDataPath, 'contacts.json');
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                let contacts: any[] = JSON.parse(data);
                contacts = contacts.filter(c => c.id !== id);
                fs.writeFileSync(filePath, JSON.stringify(contacts, null, 2));
                return { success: true };
            }
            return { success: false, error: 'File not found' };
        } catch (error) {
            console.error('Error deleting contact:', error);
            return { success: false, error: (error as Error).message };
        }
    });
} catch (e) {
    console.error('Error in Electron main process:', e);
}
