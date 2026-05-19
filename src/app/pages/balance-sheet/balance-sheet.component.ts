import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DialogModule } from 'primeng/dialog';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { InvoiceService } from '../../services/invoice.service';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { InventoryService } from '../../services/inventory.service';
import * as XLSX from 'xlsx';

interface BalanceSheetEntry {
  period: string;
  assets: number;
  liabilities: number;
  equity: number;
  details: {
    inventoryValue: number;
    receivables: number;
    payables: number;
    invoiceList: any[];
    poList: any[];
  }
}

@Component({
  selector: 'app-balance-sheet',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    SelectButtonModule,
    CardModule,
    DialogModule,
    PanelModule,
    DividerModule,
    TagModule
  ],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-3xl font-bold text-gray-800">Balance Sheet</h2>
        <div class="flex gap-4 items-center">
          <p-selectButton
            [options]="periodOptions"
            [(ngModel)]="selectedPeriod"
            (onChange)="onPeriodChange()"
            optionLabel="label"
            optionValue="value"
          ></p-selectButton>
          <p-button
            label="Export to Excel"
            icon="pi pi-file-excel"
            severity="success"
            (onClick)="exportToExcel()"
          ></p-button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <p-card header="Total Assets" class="asset-card shadow-sm border-l-4 border-blue-500">
          <div class="text-3xl font-bold text-blue-600">
            {{ currentTotals().assets | currency:'INR' }}
          </div>
          <p class="text-sm text-gray-500 mt-2">Current Value: Inventory + Receivables</p>
        </p-card>
        <p-card header="Total Liabilities" class="liability-card shadow-sm border-l-4 border-red-500">
          <div class="text-3xl font-bold text-red-600">
            {{ currentTotals().liabilities | currency:'INR' }}
          </div>
          <p class="text-sm text-gray-500 mt-2">Cumulative Accounts Payable</p>
        </p-card>
        <p-card header="Owner's Equity" class="equity-card shadow-sm border-l-4 border-green-500">
          <div class="text-3xl font-bold text-green-600">
            {{ currentTotals().equity | currency:'INR' }}
          </div>
          <p class="text-sm text-gray-500 mt-2">Net Worth: Assets - Liabilities</p>
        </p-card>
      </div>



      <p-table
        [value]="balanceData()"
        [paginator]="true"
        [rows]="10"
        [lazy]="true"
        (onLazyLoad)="loadBalanceData($event)"
        [totalRecords]="totalRecords()"
        stripedRows
        [responsiveLayout]="'scroll'"
        class="shadow-sm border rounded-lg overflow-hidden"
        [loading]="loading()"
        dataKey="period"
      >
        <ng-template #header>
          <tr>
            <th>Period</th>
            <th class="text-right">Inventory Value</th>
            <th class="text-right">Receivables</th>
            <th class="text-right">Total Assets</th>
            <th class="text-right">Payables</th>
            <th class="text-right font-bold">Equity</th>
            <th style="width: 3rem"></th>
          </tr>
        </ng-template>
        <ng-template #body let-entry>
          <tr (click)="showDetails(entry)" class="cursor-pointer hover:bg-blue-50 transition-colors">
            <td class="font-medium underline text-blue-700">{{ entry.period }}</td>
            <td class="text-right">{{ entry.details.inventoryValue | currency:'INR' }}</td>
            <td class="text-right">{{ entry.details.receivables | currency:'INR' }}</td>
            <td class="text-right text-blue-600 font-bold">{{ entry.assets | currency:'INR' }}</td>
            <td class="text-right text-red-600">{{ entry.liabilities | currency:'INR' }}</td>
            <td class="text-right text-green-600 font-bold">{{ entry.equity | currency:'INR' }}</td>
            <td><i class="pi pi-chevron-right text-gray-400"></i></td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Detail Dialog -->
      <p-dialog
        [header]="'Financial Summary: ' + selectedEntry()?.period"
        [(visible)]="displayDetails"
        [modal]="true"
        [style]="{width: '80vw'}"
        [draggable]="false"
        [resizable]="false"
        appendTo="body"
      >
        @if (selectedEntry(); as entry) {
          <div class="flex flex-col gap-6 pt-4">
            <!-- Concept Explanations -->
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 class="font-bold text-gray-700 mb-2">How to read this row?</h4>
                <p class="text-sm text-gray-600">
                    This row represents your business's financial state <strong>as of the end of {{ entry.period }}</strong>.
                </p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div class="text-xs">
                        <span class="font-bold text-blue-600">Assets:</span> What your business owns. Includes current stock value and money owed to you by customers.
                    </div>
                    <div class="text-xs">
                        <span class="font-bold text-red-600">Liabilities:</span> What your business owes. Primarily unpaid bills to suppliers (Purchase Orders).
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Assets Column -->
              <div class="flex flex-col gap-4">
                <p-panel header="Asset Breakdown" class="h-full">
                  <div class="flex flex-col gap-4">
                    <div class="flex justify-between items-center bg-blue-50 p-3 rounded border border-blue-100">
                        <span class="font-semibold text-blue-800">Accounts Receivable</span>
                        <span class="text-xl font-bold">{{ entry.details.receivables | currency:'INR' }}</span>
                    </div>

                    <p class="text-xs text-gray-500 italic">Outstanding payments from finalized invoices up to this date.</p>

                    <div class="max-h-60 overflow-y-auto">
                        <p-table [value]="entry.details.invoiceList" styleClass="p-datatable-sm" responsiveLayout="scroll" dataKey="id">
                            <ng-template #header>
                                <tr>
                                    <th>Inv #</th>
                                    <th>Customer</th>
                                    <th class="text-right">Amount</th>
                                </tr>
                            </ng-template>
                            <ng-template #body let-inv>
                                <tr>
                                    <td>{{ inv.invoiceNumber }}</td>
                                    <td>{{ inv.customerName }}</td>
                                    <td class="text-right">{{ inv.total | currency:'INR' }}</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>

                    <p-divider></p-divider>

                    <div class="flex justify-between items-center bg-gray-50 p-3 rounded">
                        <span class="font-semibold">Inventory Value</span>
                        <span class="text-xl font-bold">{{ entry.details.inventoryValue | currency:'INR' }}</span>
                    </div>
                    <p class="text-xs text-gray-500">Estimated value of goods held in stock at that time.</p>
                  </div>
                </p-panel>
              </div>

              <!-- Liabilities Column -->
              <div class="flex flex-col gap-4">
                <p-panel header="Liability Breakdown" class="h-full">
                  <div class="flex flex-col gap-4">
                    <div class="flex justify-between items-center bg-red-50 p-3 rounded border border-red-100">
                        <span class="font-semibold text-red-800">Accounts Payable</span>
                        <span class="text-xl font-bold">{{ entry.details.payables | currency:'INR' }}</span>
                    </div>

                    <p class="text-xs text-gray-500 italic">Total unpaid amounts from Purchase Orders up to this date.</p>

                    <div class="max-h-60 overflow-y-auto">
                        <p-table [value]="entry.details.poList" styleClass="p-datatable-sm" responsiveLayout="scroll" dataKey="id">
                            <ng-template #header>
                                <tr>
                                    <th>PO Reference</th>
                                    <th>Vendor</th>
                                    <th class="text-right">Amount</th>
                                </tr>
                            </ng-template>
                            <ng-template #body let-po>
                                <tr>
                                    <td>{{ po.id }}</td>
                                    <td>{{ po.sellerName }}</td>
                                    <td class="text-right">{{ po.total | currency:'INR' }}</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>
                  </div>
                </p-panel>
              </div>
            </div>

            <!-- Net Result -->
            <div class="flex justify-center mt-4">
                <div class="bg-green-600 text-white px-8 py-4 rounded-xl shadow-lg text-center transform hover:scale-105 transition-transform">
                    <div class="text-sm uppercase tracking-widest opacity-80">Owner's Equity</div>
                    <div class="text-4xl font-black">{{ entry.equity | currency:'INR' }}</div>
                    <div class="text-xs mt-1 border-t border-green-500 pt-1">Assets minus Liabilities</div>
                </div>
            </div>
          </div>
        }
      </p-dialog>
    </div>
  `,
  styles: [`
    :host { display: block; background-color: var(--surface-ground); min-height: 100vh; }
    .asset-card ::ng-deep .p-card-header { color: #3b82f6; }
    .liability-card ::ng-deep .p-card-header { color: #ef4444; }
    .equity-card ::ng-deep .p-card-header { color: #10b981; }
  `]
})
export class BalanceSheetComponent implements OnInit {
  selectedPeriod = 'yearly';
  periodOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' }
  ];

  balanceData = signal<BalanceSheetEntry[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  private allBalanceEntries: BalanceSheetEntry[] = [];

  displayDetails = false;
  selectedEntry = signal<BalanceSheetEntry | null>(null);

  currentTotals = computed(() => {
    const data = this.balanceData();
    if (data.length === 0) return { assets: 0, liabilities: 0, equity: 0 };
    // Most recent entry is the total as of now
    return data[data.length - 1];
  });



  constructor(
    private invoiceService: InvoiceService,
    private purchaseOrderService: PurchaseOrderService,
    private inventoryService: InventoryService
  ) { }

  async ngOnInit() {
    // Initial load will be triggered by p-table onLazyLoad
  }

  async onPeriodChange() {
    await this.loadBalanceData();
  }

  showDetails(entry: BalanceSheetEntry) {
    this.selectedEntry.set(entry);
    this.displayDetails = true;
  }

  async loadBalanceData(event?: TableLazyLoadEvent) {
    this.loading.set(true);
    try {
      const [invoicesResp, posResp, productsResp] = await Promise.all([
        this.invoiceService.getInvoices({ first: 0, rows: 2000 }),
        this.purchaseOrderService.getPurchaseOrders({ first: 0, rows: 2000 }),
        this.inventoryService.getProducts({ first: 0, rows: 2000 })
      ]);

      const invoices = (invoicesResp.data || []).map(inv => ({
        ...inv,
        parsedDate: inv.date ? new Date(inv.date) : new Date(inv.id)
      }));
      const purchaseOrders = (posResp.data || []).map(po => ({
        ...po,
        parsedDate: po.date ? new Date(po.date) : new Date(po.id)
      }));
      const products = productsResp.data || [];

      this.calculateSheet(invoices, purchaseOrders, products, event);
    } catch (error) {
      console.error('Error loading balance data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  calculateSheet(invoices: any[], purchaseOrders: any[], products: any[], event?: TableLazyLoadEvent) {
    const allEntries: BalanceSheetEntry[] = [];
    const now = new Date();

    // Use a consistent "end of today" as the base for i=0
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Support more periods for pagination (e.g., up to 36 months/weeks)
    let totalPeriods = 12;
    if (this.selectedPeriod === 'daily') totalPeriods = 30;
    else if (this.selectedPeriod === 'weekly') totalPeriods = 52;
    else if (this.selectedPeriod === 'yearly') totalPeriods = 10;
    else if (this.selectedPeriod === 'monthly') totalPeriods = 36;

    for (let i = totalPeriods - 1; i >= 0; i--) {
      let startDate: Date;
      let periodLabel: string;

      if (this.selectedPeriod === 'daily') {
        startDate = new Date(endOfToday);
        startDate.setDate(startDate.getDate() - i);
        periodLabel = startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } else if (this.selectedPeriod === 'weekly') {
        startDate = new Date(endOfToday);
        startDate.setDate(startDate.getDate() - (i * 7));
        periodLabel = `Ends ${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      } else if (this.selectedPeriod === 'yearly') {
        const year = now.getFullYear() - i;
        startDate = new Date(year, 11, 31, 23, 59, 59, 999);
        periodLabel = year.toString();
      } else {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), monthDate.getDate(), 23, 59, 59, 999);
        periodLabel = monthDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      }

      const periodInvoices = invoices.filter(inv => inv.parsedDate <= startDate && inv.status === 'finalized');
      const receivables = periodInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
      const periodPOs = purchaseOrders.filter(po => po.parsedDate <= startDate && po.status !== 'paid');
      const payables = periodPOs.reduce((sum, po) => sum + (Number(po.total) || Number(po.price) * (1 + (Number(po.taxPercentage) || 0) / 100) || 0), 0);

      let inventoryValue = products.reduce((sum, p) => sum + ((p.totalUnits || 0) * (p.unitPrice || 0)), 0);
      invoices.filter(inv => inv.parsedDate > startDate && inv.status === 'finalized')
        .forEach(inv => {
          inv.items?.forEach((item: any) => {
            const product = products.find(p => p.id === item.productId);
            if (product) inventoryValue += (item.quantity * product.unitPrice);
          });
        });

      purchaseOrders.filter(po => po.parsedDate > startDate)
        .forEach(po => {
          po.items?.forEach((item: any) => {
            const product = products.find(p => p.id === item.productId);
            if (product) inventoryValue -= (item.quantity * product.unitPrice);
          });
        });

      const assets = inventoryValue + receivables;
      const equity = assets - payables;

      allEntries.push({
        period: periodLabel,
        assets,
        liabilities: payables,
        equity,
        details: {
          inventoryValue,
          receivables,
          payables,
          invoiceList: periodInvoices.slice(-50),
          poList: periodPOs.slice(-50)
        }
      });
    }

    // Sort descending by period (most recent first)
    allEntries.reverse();

    this.allBalanceEntries = allEntries; // Store full data for export
    this.totalRecords.set(allEntries.length);
    
    // Apply pagination
    const first = event?.first || 0;
    const rows = event?.rows || 10;
    this.balanceData.set(allEntries.slice(first, first + rows));
  }



  exportToExcel() {
    const data = this.allBalanceEntries.map(e => ({
      Period: e.period,
      'Inventory Value': e.details.inventoryValue,
      Receivables: e.details.receivables,
      'Total Assets': e.assets,
      'Payables (Liabilities)': e.liabilities,
      Equity: e.equity
    }));

    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Balance Sheet');

    // Create workbook and write to a blob for reliable download in Electron/Browser
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Balance_Sheet_${this.selectedPeriod}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
}
