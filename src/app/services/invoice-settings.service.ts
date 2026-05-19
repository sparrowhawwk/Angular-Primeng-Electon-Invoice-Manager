import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class InvoiceSettingsService {
    private ipc: any;

    constructor() {
        if ((window as any).require) {
            try {
                this.ipc = (window as any).require('electron').ipcRenderer;
            } catch (e) {
                throw e;
            }
        } else {
            console.warn('Electron\'s IPC was not loaded');
        }
    }

    async saveInvoiceSettings(data: any): Promise<any> {
        if (!this.ipc) return Promise.reject('IPC not available');
        return await this.ipc.invoke('save-invoice-settings', data);
    }

    async getInvoiceSettings(): Promise<any> {
        if (!this.ipc) return Promise.resolve(null);
        return await this.ipc.invoke('get-invoice-settings');
    }
}
