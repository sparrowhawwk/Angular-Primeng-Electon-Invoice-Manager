import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class InvoiceService {
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

    async getInvoices(options?: { globalFilter?: string, first?: number, rows?: number }): Promise<{ data: any[], totalRecords: number }> {
        if (!this.ipc) return Promise.resolve({ data: [], totalRecords: 0 });
        return await this.ipc.invoke('get-invoices', options);
    }

    async getInvoiceById(id: number): Promise<any> {
        if (!this.ipc) return Promise.resolve(null);
        return await this.ipc.invoke('get-invoice-by-id', id);
    }

    async saveInvoice(invoice: any): Promise<any> {
        if (!this.ipc) return Promise.reject('IPC not available');
        return await this.ipc.invoke('save-invoice', invoice);
    }

    async deleteInvoice(id: number): Promise<any> {
        if (!this.ipc) return Promise.reject('IPC not available');
        return await this.ipc.invoke('delete-invoice', id);
    }
}
