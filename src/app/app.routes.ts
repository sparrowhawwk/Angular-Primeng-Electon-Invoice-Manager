import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'invoices',
        loadComponent: () => import('./pages/invoices/invoices.component').then(m => m.InvoicesComponent)
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

