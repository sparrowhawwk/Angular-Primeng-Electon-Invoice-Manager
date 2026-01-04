import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { PurchaseOrderService } from '../../services/purchase-order.service';

@Component({
    selector: 'app-purchase-chart',
    standalone: true,
    imports: [CommonModule, FormsModule, PanelModule, ChartModule, SelectModule],
    template: `
    @if (purchaseData()) {
      <div class="card shadow-sm border rounded-lg p-2 bg-white mb-6">
        <div class="flex justify-between items-start mb-2">
          <div>
            <h3 class="text-lg font-bold text-gray-700">Recent Purchase Orders</h3>
            <p class="text-xs text-gray-500">Procurement spending (Monthly)</p>
          </div>
          <div class="flex flex-col items-end gap-2">
            <p-select [options]="availableYears" [ngModel]="selectedPurchaseYear()" (ngModelChange)="onPurchaseYearChange($event)" class="p-inputtext-sm"></p-select>
            <div class="text-right">
              <span class="text-2xl font-bold text-amber-600">{{ totalProcurement() | currency:'INR' }}</span>
              <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Spending</p>
            </div>
          </div>
        </div>
        <div style="height: 200px">
          <p-chart type="line" [data]="purchaseData()" [options]="chartOptions"></p-chart>
        </div>
      </div>
    }
  `
})
export class PurchaseChartComponent implements OnInit {
    purchaseData = signal<any>(null);
    totalProcurement = signal(0);
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

    constructor(private poService: PurchaseOrderService) {
        const currentYear = new Date().getFullYear();
        for (let i = 0; i <= 10; i++) {
            this.availableYears.push(currentYear - i);
        }
    }

    async ngOnInit() {
        await this.loadPurchaseData();
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

            const monthlyTotals = new Array(12).fill(0);
            filteredPurchases.forEach(p => {
                const date = p.purchaseDate ? new Date(p.purchaseDate) : new Date(p.id);
                monthlyTotals[date.getMonth()] += Number(p.price || 0);
            });

            const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            this.purchaseData.set({
                labels: monthLabels,
                datasets: [
                    {
                        label: 'Spending (₹)',
                        data: monthlyTotals,
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

    onPurchaseYearChange(year: number) {
        this.selectedPurchaseYear.set(year);
        this.loadPurchaseData();
    }
}
