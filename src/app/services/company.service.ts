import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CompanyService {
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

    async saveCompanyInfo(data: any): Promise<any> {
        if (!this.ipc) return Promise.reject('IPC not available');
        return await this.ipc.invoke('save-company-info', data);
    }

    async getCompanyInfo(): Promise<any> {
        if (!this.ipc) return Promise.resolve(null);
        return await this.ipc.invoke('get-company-info');
    }
}
