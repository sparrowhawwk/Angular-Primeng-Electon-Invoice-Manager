import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelModule } from 'primeng/panel';
import { ChartModule } from 'primeng/chart';
import { InvoiceService } from '../../services/invoice.service';
import { InventoryService } from '../../services/inventory.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, PanelModule, ChartModule],
    template: `
    <div class="p-6">
      <p-panel header="Dashboard Overview">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <!-- Transaction Data Chart -->
          <div class="card shadow-sm border rounded-lg p-4 bg-white" *ngIf="transactionData()">
            <h3 class="text-lg font-bold mb-4 text-gray-700">Recent Transactions</h3>
            <div style="height: 300px">
              <p-chart type="line" [data]="transactionData()" [options]="chartOptions"></p-chart>
            </div>
          </div>

          <!-- Inventory Data Chart -->
          <div class="card shadow-sm border rounded-lg p-4 bg-white" *ngIf="inventoryData()">
            <h3 class="text-lg font-bold mb-4 text-gray-700">Inventory Levels</h3>
            <div style="height: 300px">
              <p-chart type="bar" [data]="inventoryData()" [options]="chartOptions"></p-chart>
            </div>
          </div>
        </div>
      </p-panel>
    </div>
  `,
    styles: `
    :host {
      display: block;
      height: 100%;
      background-color: var(--surface-ground);
    }
  `
})
export class DashboardComponent implements OnInit {
    transactionData = signal<any>(null);
    inventoryData = signal<any>(null);

    chartOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    color: '#4b5563'
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#6b7280' },
                grid: { color: '#f3f4f6', display: false }
            },
            y: {
                ticks: { color: '#6b7280' },
                grid: { color: '#f3f4f6' }
            }
        }
    };

    constructor(
        private invoiceService: InvoiceService,
        private inventoryService: InventoryService
    ) { }

    async ngOnInit() {
        await Promise.all([
            this.loadTransactionData(),
            this.loadInventoryData()
        ]);
    }

    async loadTransactionData() {
        try {
            const response = await this.invoiceService.getInvoices({ first: 0, rows: 12 });
            const invoices = [...(response?.data || [])].reverse();

            this.transactionData.set({
                labels: invoices.map(inv => inv.invoiceNumber || `INV-${inv.id}`),
                datasets: [
                    {
                        label: 'Amount (₹)',
                        data: invoices.map(inv => inv.total),
                        fill: true,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    }
                ]
            });
        } catch (error) {
            console.error('Error loading transaction data:', error);
        }
    }

    async loadInventoryData() {
        try {
            const response = await this.inventoryService.getProducts({ first: 0, rows: 8 });
            const products = response?.data || [];

            this.inventoryData.set({
                labels: products.map(p => p.name),
                datasets: [
                    {
                        label: 'Stock Quantity',
                        data: products.map(p => p.totalUnits),
                        backgroundColor: '#10b981',
                        borderRadius: 4
                    }
                ]
            });
        } catch (error) {
            console.error('Error loading inventory data:', error);
        }
    }
}
