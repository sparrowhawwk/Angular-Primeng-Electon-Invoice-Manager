import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class PurchaseOrderService {
    private ipcRenderer: any;

    constructor() {
        if ((window as any).require) {
            try {
                this.ipcRenderer = (window as any).require('electron').ipcRenderer;
            } catch (e) {
                throw e;
            }
        } else {
            console.warn('Electron\'s IPC was not loaded');
        }
    }

    async getPurchaseOrders(options?: { globalFilter?: string, first?: number, rows?: number, filters?: any, sortField?: string, sortOrder?: number }): Promise<{ data: any[], totalRecords: number }> {
        return await this.ipcRenderer.invoke('get-purchase-orders', options);
    }

    async savePurchaseOrder(purchase: any): Promise<{ success: boolean, error?: string }> {
        return await this.ipcRenderer.invoke('save-purchase-order', purchase);
    }

    async deletePurchaseOrder(id: number): Promise<{ success: boolean, error?: string }> {
        return await this.ipcRenderer.invoke('delete-purchase-order', id);
    }
}
