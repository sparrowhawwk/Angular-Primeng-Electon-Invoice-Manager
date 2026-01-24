import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { TieredMenu } from 'primeng/tieredmenu';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [TieredMenu, RouterModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
    items: MenuItem[] | undefined;

    ngOnInit() {
        this.items = [
            {
                label: 'Invoices',
                icon: 'pi pi-file',
                routerLink: '/invoices',
                routerLinkActiveOptions: { exact: true }
            },
            {
                label: 'Purchase Order',
                icon: 'pi pi-shopping-cart',
                routerLink: '/purchase-orders'
            },
            {
                label: 'Balance Sheet',
                icon: 'pi pi-chart-bar',
                routerLink: '/balance-sheet'
            },
            {
                label: 'Admin',
                icon: 'pi pi-cog',
                items: [
                    {
                        label: 'Contacts',
                        icon: 'pi pi-address-book',
                        routerLink: '/admin/contacts'
                    },
                    {
                        label: 'Inventory',
                        icon: 'pi pi-box',
                        routerLink: '/admin/inventory'
                    }
                ]
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
