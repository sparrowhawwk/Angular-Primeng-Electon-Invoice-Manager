import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
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

    async getProducts(options?: { globalFilter?: string, first?: number, rows?: number, filters?: any, sortField?: string, sortOrder?: number }): Promise<{ data: any[], totalRecords: number }> {
        if (!this.ipc) return Promise.resolve({ data: [], totalRecords: 0 });
        return await this.ipc.invoke('get-products', options);
    }

    async saveProduct(product: any): Promise<any> {
        if (!this.ipc) return Promise.reject('IPC not available');
        return await this.ipc.invoke('save-product', product);
    }

    async deleteProduct(id: number): Promise<any> {
        if (!this.ipc) return Promise.reject('IPC not available');
        return await this.ipc.invoke('delete-product', id);
    }
}
