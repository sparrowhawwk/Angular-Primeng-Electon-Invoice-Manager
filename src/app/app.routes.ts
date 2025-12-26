import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { AdminComponent } from './pages/admin/admin.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { CompanyComponent } from './pages/settings/company/company';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'invoices', component: InvoicesComponent },
    { path: 'admin', component: AdminComponent },
    { path: 'settings', component: SettingsComponent },
    { path: 'settings/company', component: CompanyComponent }
];
