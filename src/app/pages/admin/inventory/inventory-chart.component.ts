import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { InventoryService } from '../../../services/inventory.service';

@Component({
    selector: 'app-inventory-chart',
    standalone: true,
    imports: [CommonModule, FormsModule, PanelModule, ChartModule, SelectModule],
    template: `
    @if (inventoryData()) {
      <div class="card shadow-sm border rounded-lg p-2 bg-white mb-6">
        <div class="flex justify-between items-start mb-2">
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
        <div style="height: 200px">
          <p-chart type="bar" [data]="inventoryData()" [options]="chartOptions"></p-chart>
        </div>
      </div>
    }
  `
})
export class InventoryChartComponent implements OnInit {
    inventoryData = signal<any>(null);
    totalStock = signal(0);
    selectedInventoryYear = signal(new Date().getFullYear());
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

    constructor(private inventoryService: InventoryService) {
        const currentYear = new Date().getFullYear();
        for (let i = 0; i <= 10; i++) {
            this.availableYears.push(currentYear - i);
        }
    }

    async ngOnInit() {
        await this.loadInventoryData();
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

    onInventoryYearChange(year: number) {
        this.selectedInventoryYear.set(year);
        this.loadInventoryData();
    }
}
