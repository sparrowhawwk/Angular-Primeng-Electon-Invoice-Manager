import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { InvoiceService } from '../../services/invoice.service';
import { InventoryService } from '../../services/inventory.service';
import { PurchaseOrderService } from '../../services/purchase-order.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, PanelModule, ChartModule, SelectModule],
  template: `
    <div class="p-6">
      <p-panel header="Dashboard Overview">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <!-- Transaction Data Chart -->
          @if (transactionData()) {
            <div class="card shadow-sm border rounded-lg p-4 bg-white">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-lg font-bold text-gray-700">Recent Transactions</h3>
                  <p class="text-xs text-gray-500">Sales volume over time</p>
                </div>
                <div class="flex flex-col items-end gap-2">
                  <p-select [options]="availableYears" [ngModel]="selectedInvoiceYear()" (ngModelChange)="onInvoiceYearChange($event)" class="p-inputtext-sm"></p-select>
                  <div class="text-right">
                    <span class="text-2xl font-bold text-blue-600">{{ totalRevenue() | currency:'INR' }}</span>
                    <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Sales</p>
                  </div>
                </div>
              </div>
              <div style="height: 300px">
                <p-chart type="line" [data]="transactionData()" [options]="chartOptions"></p-chart>
              </div>
            </div>
          }

          <!-- Inventory Data Chart -->
          @if (inventoryData()) {
            <div class="card shadow-sm border rounded-lg p-4 bg-white">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-lg font-bold text-gray-700">Inventory Levels</h3>
                  <p class="text-xs text-gray-500">Current stock per product</p>
                </div>
                <div class="flex flex-col items-end gap-2">
                  <p-select [options]="availableYears" [ngModel]="selectedInventoryYear()" (ngModelChange)="onInventoryYearChange($event)" class="p-inputtext-sm"></p-select>
                  <div class="text-right">
                    <span class="text-2xl font-bold text-emerald-600">{{ totalStock() }}</span>
                    <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Items</p>
                  </div>
                </div>
              </div>
              <div style="height: 300px">
                <p-chart type="bar" [data]="inventoryData()" [options]="chartOptions"></p-chart>
              </div>
            </div>
          }

          <!-- Purchase Order Data Chart -->
          @if (purchaseData()) {
            <div class="card shadow-sm border rounded-lg p-4 bg-white">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-lg font-bold text-gray-700">Recent Purchase Orders</h3>
                  <p class="text-xs text-gray-500">Procurement spending</p>
                </div>
                <div class="flex flex-col items-end gap-2">
                  <p-select [options]="availableYears" [ngModel]="selectedPurchaseYear()" (ngModelChange)="onPurchaseYearChange($event)" class="p-inputtext-sm"></p-select>
                  <div class="text-right">
                    <span class="text-2xl font-bold text-amber-600">{{ totalProcurement() | currency:'INR' }}</span>
                    <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Spending</p>
                  </div>
                </div>
              </div>
              <div style="height: 300px">
                <p-chart type="line" [data]="purchaseData()" [options]="chartOptions"></p-chart>
              </div>
            </div>
          }
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
  purchaseData = signal<any>(null);

  totalRevenue = signal(0);
  totalStock = signal(0);
  totalProcurement = signal(0);

  selectedInvoiceYear = signal(new Date().getFullYear());
  selectedInventoryYear = signal(new Date().getFullYear());
  selectedPurchaseYear = signal(new Date().getFullYear());

  availableYears: number[] = [];

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
    private inventoryService: InventoryService,
    private poService: PurchaseOrderService
  ) {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i <= 10; i++) {
      this.availableYears.push(currentYear - i);
    }
  }

  async ngOnInit() {
    await Promise.all([
      this.loadTransactionData(),
      this.loadInventoryData(),
      this.loadPurchaseData()
    ]);
  }

  async loadTransactionData() {
    try {
      const response = await this.invoiceService.getInvoices({ first: 0, rows: 1000 });
      const allInvoices = response?.data || [];

      const filteredInvoices = allInvoices.filter(inv => {
        const date = inv.date ? new Date(inv.date) : new Date(inv.id);
        return date.getFullYear() === this.selectedInvoiceYear();
      });

      this.totalRevenue.set(filteredInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0));

      const displayInvoices = [...filteredInvoices.slice(0, 12)].reverse();

      this.transactionData.set({
        labels: displayInvoices.map(inv => inv.invoiceNumber || `INV-${inv.id}`),
        datasets: [
          {
            label: 'Amount (₹)',
            data: displayInvoices.map(inv => inv.total),
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
      const response = await this.inventoryService.getProducts({ first: 0, rows: 1000 });
      const allProducts = response?.data || [];

      const filteredProducts = allProducts.filter(p => {
        const date = new Date(p.id); // products use Date.now() as id if not provided
        return date.getFullYear() === this.selectedInventoryYear();
      });

      this.totalStock.set(filteredProducts.reduce((sum, p) => sum + Number(p.totalUnits || 0), 0));

      const displayProducts = filteredProducts.slice(0, 8);

      this.inventoryData.set({
        labels: displayProducts.map(p => p.name),
        datasets: [
          {
            label: 'Stock Quantity',
            data: displayProducts.map(p => p.totalUnits),
            backgroundColor: '#10b981',
            borderRadius: 4
          }
        ]
      });
    } catch (error) {
      console.error('Error loading inventory data:', error);
    }
  }

  async loadPurchaseData() {
    try {
      const response = await this.poService.getPurchaseOrders({ first: 0, rows: 1000 });
      const allPurchases = response?.data || [];

      const filteredPurchases = allPurchases.filter(p => {
        const date = p.purchaseDate ? new Date(p.purchaseDate) : new Date(p.id);
        return date.getFullYear() === this.selectedPurchaseYear();
      });

      this.totalProcurement.set(filteredPurchases.reduce((sum, p) => sum + Number(p.price || 0), 0));

      const displayPurchases = [...filteredPurchases.slice(0, 12)].reverse();

      this.purchaseData.set({
        labels: displayPurchases.map(p => p.sellerName),
        datasets: [
          {
            label: 'Purchase Amount (₹)',
            data: displayPurchases.map(p => parseFloat(p.price || 0)),
            fill: true,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4
          }
        ]
      });
    } catch (error) {
      console.error('Error loading purchase data:', error);
    }
  }

  onInvoiceYearChange(year: number) {
    this.selectedInvoiceYear.set(year);
    this.loadTransactionData();
  }

  onInventoryYearChange(year: number) {
    this.selectedInventoryYear.set(year);
    this.loadInventoryData();
  }

  onPurchaseYearChange(year: number) {
    this.selectedPurchaseYear.set(year);
    this.loadPurchaseData();
  }
}
