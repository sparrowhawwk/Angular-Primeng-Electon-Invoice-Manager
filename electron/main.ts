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

    // Inventory Handlers
    ipcMain.handle('get-products', async (event, options?: { globalFilter?: string, first?: number, rows?: number }) => {
        try {
            const userDataPath = app.getPath('userData');
            const filePath = path.join(userDataPath, 'products.json');
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                let products: any[] = JSON.parse(data);

                if (options?.globalFilter) {
                    const filterValue = options.globalFilter.toLowerCase();
                    products = products.filter(p =>
                        (p.name && p.name.toLowerCase().includes(filterValue)) ||
                        (p.description && p.description.toLowerCase().includes(filterValue))
                    );
                }

                const totalRecords = products.length;

                if (options?.first !== undefined && options?.rows !== undefined) {
                    products = products.slice(options.first, options.first + options.rows);
                }

                return { data: products, totalRecords };
            }
            return { data: [], totalRecords: 0 };
        } catch (error) {
            console.error('Error getting products:', error);
            return { data: [], totalRecords: 0 };
        }
    });

    ipcMain.handle('save-product', async (event, product) => {
        try {
            const userDataPath = app.getPath('userData');
            if (!fs.existsSync(userDataPath)) {
                fs.mkdirSync(userDataPath, { recursive: true });
            }
            const filePath = path.join(userDataPath, 'products.json');
            let products: any[] = [];
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                products = JSON.parse(data);
            }

            if (product.id) {
                const index = products.findIndex(p => p.id === product.id);
                if (index !== -1) {
                    products[index] = { ...product };
                } else {
                    return { success: false, error: 'Product not found' };
                }
            } else {
                products.push({ ...product, id: Date.now() });
            }

            fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
            return { success: true };
        } catch (error) {
            console.error('Error saving product:', error);
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('delete-product', async (event, id) => {
        try {
            const userDataPath = app.getPath('userData');
            const filePath = path.join(userDataPath, 'products.json');
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                let products: any[] = JSON.parse(data);
                products = products.filter(p => p.id !== id);
                fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
                return { success: true };
            }
            return { success: false, error: 'File not found' };
        } catch (error) {
            console.error('Error deleting product:', error);
            return { success: false, error: (error as Error).message };
        }
    });

    // Invoice Handlers
    ipcMain.handle('get-invoices', async (event, options?: { globalFilter?: string, first?: number, rows?: number }) => {
        try {
            const userDataPath = app.getPath('userData');
            const filePath = path.join(userDataPath, 'invoices.json');
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                let invoices: any[] = JSON.parse(data);

                if (options?.globalFilter) {
                    const filterValue = options.globalFilter.toLowerCase();
                    invoices = invoices.filter(inv =>
                        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(filterValue)) ||
                        (inv.customerName && inv.customerName.toLowerCase().includes(filterValue))
                    );
                }

                const totalRecords = invoices.length;

                if (options?.first !== undefined && options?.rows !== undefined) {
                    invoices = invoices.slice(options.first, options.first + options.rows);
                }

                return { data: invoices, totalRecords };
            }
            return { data: [], totalRecords: 0 };
        } catch (error) {
            console.error('Error getting invoices:', error);
            return { data: [], totalRecords: 0 };
        }
    });

    ipcMain.handle('get-invoice-by-id', async (event, id: number) => {
        try {
            const userDataPath = app.getPath('userData');
            const filePath = path.join(userDataPath, 'invoices.json');
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                const invoices: any[] = JSON.parse(data);
                const invoice = invoices.find(inv => inv.id === id);
                return invoice || null;
            }
            return null;
        } catch (error) {
            console.error('Error getting invoice by id:', error);
            return null;
        }
    });

    ipcMain.handle('save-invoice', async (event, invoice) => {
        try {
            const userDataPath = app.getPath('userData');
            if (!fs.existsSync(userDataPath)) {
                fs.mkdirSync(userDataPath, { recursive: true });
            }
            const filePath = path.join(userDataPath, 'invoices.json');
            let invoices: any[] = [];
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                invoices = JSON.parse(data);
            }

            let isNewFinalization = false;
            if (invoice.id) {
                const index = invoices.findIndex(inv => inv.id === invoice.id);
                if (index !== -1) {
                    if (invoice.status === 'finalized' && invoices[index].status !== 'finalized') {
                        isNewFinalization = true;
                    }
                    invoices[index] = { ...invoice };
                } else {
                    return { success: false, error: 'Invoice not found' };
                }
            } else {
                const today = new Date();
                const dateStr = today.getFullYear().toString() +
                    (today.getMonth() + 1).toString().padStart(2, '0') +
                    today.getDate().toString().padStart(2, '0');

                const dayInvoices = invoices.filter(inv => inv.invoiceNumber && inv.invoiceNumber.includes(`INV-${dateStr}`));
                const sequence = (dayInvoices.length + 1).toString().padStart(2, '0');
                const invoiceNumber = `INV-${dateStr}-${sequence}`;

                if (invoice.status === 'finalized') {
                    isNewFinalization = true;
                }

                invoices.push({
                    ...invoice,
                    id: Date.now(),
                    invoiceNumber: invoiceNumber
                });
            }

            // Perform stock deduction if finalizing
            if (isNewFinalization && invoice.items && Array.isArray(invoice.items)) {
                const productsPath = path.join(userDataPath, 'products.json');
                if (fs.existsSync(productsPath)) {
                    const productsData = fs.readFileSync(productsPath, 'utf-8');
                    let products = JSON.parse(productsData);
                    let productsUpdated = false;

                    invoice.items.forEach((item: any) => {
                        const productIndex = products.findIndex((p: any) => p.id === item.productId);
                        if (productIndex !== -1) {
                            products[productIndex].totalUnits = (products[productIndex].totalUnits || 0) - (item.quantity || 0);
                            productsUpdated = true;
                        }
                    });

                    if (productsUpdated) {
                        fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
                    }
                }
            }

            fs.writeFileSync(filePath, JSON.stringify(invoices, null, 2));
            return { success: true };
        } catch (error) {
            console.error('Error saving invoice:', error);
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('delete-invoice', async (event, id) => {
        try {
            const userDataPath = app.getPath('userData');
            const filePath = path.join(userDataPath, 'invoices.json');
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                let invoices: any[] = JSON.parse(data);
                invoices = invoices.filter(inv => inv.id !== id);
                fs.writeFileSync(filePath, JSON.stringify(invoices, null, 2));
                return { success: true };
            }
            return { success: false, error: 'File not found' };
        } catch (error) {
            console.error('Error deleting invoice:', error);
            return { success: false, error: (error as Error).message };
        }
    });

    // Purchase Order Handlers
    ipcMain.handle('get-purchase-orders', async (event, options?: { globalFilter?: string, first?: number, rows?: number }) => {
        try {
            const userDataPath = app.getPath('userData');
            const filePath = path.join(userDataPath, 'purchases.json');
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                let purchases: any[] = JSON.parse(data);

                if (options?.globalFilter) {
                    const filterValue = options.globalFilter.toLowerCase();
                    purchases = purchases.filter(p =>
                        (p.sellerName && p.sellerName.toLowerCase().includes(filterValue)) ||
                        (p.sellerGst && p.sellerGst.toLowerCase().includes(filterValue)) ||
                        (p.notes && p.notes.toLowerCase().includes(filterValue))
                    );
                }

                const totalRecords = purchases.length;

                if (options?.first !== undefined && options?.rows !== undefined) {
                    purchases = purchases.slice(options.first, options.first + options.rows);
                }

                return { data: purchases, totalRecords };
            }
            return { data: [], totalRecords: 0 };
        } catch (error) {
            console.error('Error getting purchase orders:', error);
            return { data: [], totalRecords: 0 };
        }
    });

    ipcMain.handle('save-purchase-order', async (event, purchase) => {
        try {
            const userDataPath = app.getPath('userData');
            if (!fs.existsSync(userDataPath)) {
                fs.mkdirSync(userDataPath, { recursive: true });
            }
            const filePath = path.join(userDataPath, 'purchases.json');
            let purchases: any[] = [];
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                purchases = JSON.parse(data);
            }

            if (purchase.id) {
                const index = purchases.findIndex(p => p.id === purchase.id);
                if (index !== -1) {
                    purchases[index] = { ...purchase };
                } else {
                    return { success: false, error: 'Purchase Order not found' };
                }
            } else {
                purchases.push({ ...purchase, id: Date.now() });
            }

            fs.writeFileSync(filePath, JSON.stringify(purchases, null, 2));
            return { success: true };
        } catch (error) {
            console.error('Error saving purchase order:', error);
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('delete-purchase-order', async (event, id) => {
        try {
            const userDataPath = app.getPath('userData');
            const filePath = path.join(userDataPath, 'purchases.json');
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                let purchases: any[] = JSON.parse(data);
                purchases = purchases.filter(p => p.id !== id);
                fs.writeFileSync(filePath, JSON.stringify(purchases, null, 2));
                return { success: true };
            }
            return { success: false, error: 'File not found' };
        } catch (error) {
            console.error('Error deleting purchase order:', error);
            return { success: false, error: (error as Error).message };
        }
    });
} catch (e) {
    console.error('Error in Electron main process:', e);
}
