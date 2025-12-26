import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ContactService {
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

    async getContacts(options?: { globalFilter?: string, first?: number, rows?: number }): Promise<{ data: any[], totalRecords: number }> {
        if (!this.ipc) return Promise.resolve({ data: [], totalRecords: 0 });
        return await this.ipc.invoke('get-contacts', options);
    }

    async saveContact(contact: any): Promise<any> {
        if (!this.ipc) return Promise.reject('IPC not available');
        return await this.ipc.invoke('save-contact', contact);
    }

    async deleteContact(id: number): Promise<any> {
        if (!this.ipc) return Promise.reject('IPC not available');
        return await this.ipc.invoke('delete-contact', id);
    }
}
