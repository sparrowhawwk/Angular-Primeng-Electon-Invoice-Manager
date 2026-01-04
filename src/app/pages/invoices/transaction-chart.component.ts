import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { InvoiceService } from '../../services/invoice.service';

@Component({
    selector: 'app-transaction-chart',
    standalone: true,
    imports: [CommonModule, FormsModule, PanelModule, ChartModule, SelectModule],
    template: `
    @if (transactionData()) {
      <div class="card shadow-sm border rounded-lg p-2 bg-white mb-6">
        <div class="flex justify-between items-start mb-2">
          <div>
            <h3 class="text-lg font-bold text-gray-700">Recent Transactions</h3>
            <p class="text-xs text-gray-500">Sales volume over time (Monthly)</p>
          </div>
          <div class="flex flex-col items-end gap-2">
            <p-select [options]="availableYears" [ngModel]="selectedInvoiceYear()" (ngModelChange)="onInvoiceYearChange($event)" class="p-inputtext-sm"></p-select>
            <div class="text-right">
              <span class="text-2xl font-bold text-blue-600">{{ totalRevenue() | currency:'INR' }}</span>
              <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Sales</p>
            </div>
          </div>
        </div>
        <div style="height: 200px">
          <p-chart type="line" [data]="transactionData()" [options]="chartOptions"></p-chart>
        </div>
      </div>
    }
  `
})
export class TransactionChartComponent implements OnInit {
    transactionData = signal<any>(null);
    totalRevenue = signal(0);
    selectedInvoiceYear = signal(new Date().getFullYear());
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

    constructor(private invoiceService: InvoiceService) {
        const currentYear = new Date().getFullYear();
        for (let i = 0; i <= 10; i++) {
            this.availableYears.push(currentYear - i);
        }
    }

    async ngOnInit() {
        await this.loadTransactionData();
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

            const monthlyTotals = new Array(12).fill(0);
            filteredInvoices.forEach(inv => {
                const date = inv.date ? new Date(inv.date) : new Date(inv.id);
                monthlyTotals[date.getMonth()] += Number(inv.total || 0);
            });

            const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            this.transactionData.set({
                labels: monthLabels,
                datasets: [
                    {
                        label: 'Sales (₹)',
                        data: monthlyTotals,
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

    onInvoiceYearChange(year: number) {
        this.selectedInvoiceYear.set(year);
        this.loadTransactionData();
    }
}
