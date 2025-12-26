import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [Menubar],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
    items: MenuItem[] | undefined;

    ngOnInit() {
        this.items = [
            {
                label: 'Dashboard',
                icon: 'pi pi-home',
                routerLink: '/dashboard'
            },
            {
                label: 'Invoices',
                icon: 'pi pi-file',
                routerLink: '/invoices'
            },
            {
                label: 'Admin',
                icon: 'pi pi-cog',
                routerLink: '/admin'
            },
            {
                label: 'Settings',
                icon: 'pi pi-sliders-h',
                items: [
                    {
                        label: 'Company',
                        icon: 'pi pi-briefcase',
                        routerLink: '/settings/company'
                    }
                ]
            }
        ];
    }
}
