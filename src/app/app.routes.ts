import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: '/invoices', pathMatch: 'full' },
    {
        path: 'invoices',
        loadComponent: () => import('./pages/invoices/invoices.component').then(m => m.InvoicesComponent)
    },
    {
        path: 'purchase-orders',
        loadComponent: () => import('./pages/purchase-orders/purchase-orders.component').then(m => m.PurchaseOrdersComponent)
    },
    {
        path: 'invoices/view/:id',
        loadComponent: () => import('./pages/invoices/invoice-summary.component').then(m => m.InvoiceSummaryComponent)
    },
    {
        path: 'admin',
        loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
    },
    {
        path: 'admin/contacts',
        loadComponent: () => import('./pages/admin/contacts/contacts').then(m => m.ContactsComponent)
    },
    {
        path: 'admin/inventory',
        loadComponent: () => import('./pages/admin/inventory/inventory').then(m => m.InventoryComponent)
    },
    {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
    },
    {
        path: 'settings/company',
        loadComponent: () => import('./pages/settings/company/company').then(m => m.CompanyComponent)
    }
];

