import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { InvoiceSummaryComponent } from './pages/invoices/invoice-summary.component';
import { AdminComponent } from './pages/admin/admin.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { Component } from '@angular/core';
import { CompanyComponent } from './pages/settings/company/company';
import { ContactsComponent } from './pages/admin/contacts/contacts';
import { InventoryComponent } from './pages/admin/inventory/inventory';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'invoices', component: InvoicesComponent },
    { path: 'invoices/view/:id', component: InvoiceSummaryComponent },
    { path: 'admin', component: AdminComponent },
    { path: 'admin/contacts', component: ContactsComponent },
    { path: 'admin/inventory', component: InventoryComponent },
    { path: 'settings', component: SettingsComponent },
    { path: 'settings/company', component: CompanyComponent }
];
