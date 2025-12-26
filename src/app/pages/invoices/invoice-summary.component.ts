import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InvoiceService } from '../../services/invoice.service';
import { CompanyService } from '../../services/company.service';
import { ContactService } from '../../services/contact.service';

@Component({
    selector: 'app-invoice-summary',
    standalone: true,
    imports: [CommonModule, ButtonModule, RouterLink],
    template: `
    <div class="p-6 max-w-5xl mx-auto">
      <div class="flex justify-between items-center mb-6 no-print">
        <p-button 
          label="Back to List" 
          icon="pi pi-arrow-left" 
          [text]="true" 
          routerLink="/invoices"
        ></p-button>
        <div class="flex gap-2">
          <p-button 
            label="Print Invoice" 
            icon="pi pi-print" 
            (onClick)="print()"
          ></p-button>
        </div>
      </div>

      <div id="invoice-bill" class="bg-white p-12 shadow-sm rounded-lg border">
        <!-- Header -->
        <div class="flex justify-between items-start border-b-2 border-primary-500 pb-8 mb-8">
          <div>
            <h1 class="text-4xl font-bold text-primary-600 mb-2">INVOICE</h1>
            <p class="text-gray-500"># {{ invoice()?.invoiceNumber }}</p>
          </div>
          <div class="text-right">
            <h2 class="text-xl font-bold text-gray-800">{{ company()?.name }}</h2>
            <div class="text-sm text-gray-500 mt-1 whitespace-pre-line">
              {{ company()?.address }}
              {{ company()?.email }} | {{ company()?.phone }}
              <div class="mt-1 font-semibold">GSTIN: {{ company()?.gstin }}</div>
            </div>
          </div>
        </div>

        <!-- Details -->
        <div class="grid grid-cols-2 gap-12 mb-12">
          <div>
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Bill To</h3>
            <div class="font-bold text-lg text-gray-800">{{ invoice()?.customerName }}</div>
            <div class="text-gray-600 mt-2 space-y-1">
              <p>{{ customer()?.address1 }}</p>
              <p>{{ customer()?.address2 }}</p>
              <p>{{ customer()?.phone }}</p>
              <p>{{ customer()?.email }}</p>
              <p class="mt-2 font-semibold">GSTIN: {{ customer()?.gstin }}</p>
            </div>
          </div>
          <div class="text-right">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Invoice Details</h3>
            <div class="space-y-2">
              <div class="flex justify-end gap-4">
                <span class="text-gray-500">Invoice Date:</span>
                <span class="font-bold">{{ invoice()?.date | date }}</span>
              </div>
              <div class="flex justify-end gap-4">
                <span class="text-gray-500">Due Date:</span>
                <span class="font-bold text-red-600">{{ invoice()?.dueDate | date }}</span>
              </div>
              <div class="flex justify-end gap-4 mt-4 pt-4 border-t border-dashed">
                <span class="text-gray-500">Status:</span>
                <span class="p-tag p-tag-success">{{ invoice()?.status | titlecase }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <table class="w-100 mb-12 border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b-2 border-gray-200">
              <th class="text-left p-4 font-bold text-gray-700">Product</th>
              <th class="text-left p-4 font-bold text-gray-700">Description</th>
              <th class="text-center p-4 font-bold text-gray-700">Qty</th>
              <th class="text-right p-4 font-bold text-gray-700">Price</th>
              <th class="text-right p-4 font-bold text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            @for (item of invoice()?.items; track $index) {
              <tr class="border-b border-gray-100">
                <td class="p-4">{{ item.productName }}</td>
                <td class="p-4 text-gray-500 text-sm">{{ item.description }}</td>
                <td class="p-4 text-center">{{ item.quantity }}</td>
                <td class="p-4 text-right">{{ item.unitPrice | currency:'INR' }}</td>
                <td class="p-4 text-right font-semibold">{{ item.amount | currency:'INR' }}</td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Summary -->
        <div class="flex flex-col items-end">
          <div class="w-80 space-y-3">
            <div class="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span class="font-semibold">{{ invoice()?.subtotal | currency:'INR' }}</span>
            </div>
            <div class="flex justify-between text-gray-600">
              <span>Tax ({{ invoice()?.taxType }} {{ invoice()?.taxRate }}%):</span>
              <span class="font-semibold">{{ invoice()?.taxAmount | currency:'INR' }}</span>
            </div>
            <div class="flex justify-between text-xl font-bold text-primary-600 border-t-2 border-primary-500 pt-3 mt-3">
              <span>Total Amount:</span>
              <span>{{ invoice()?.total | currency:'INR' }}</span>
            </div>
          </div>
        </div>

        @if (invoice()?.notes) {
          <div class="mt-16 pt-8 border-t border-gray-100">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
            <p class="text-gray-600 text-sm whitespace-pre-wrap italic">{{ invoice()?.notes }}</p>
          </div>
        }

        <div class="mt-20 text-center text-gray-400 text-xs border-t pt-8">
          Thank you for your business!
        </div>
      </div>
    </div>

    <style>
      .w-100 { width: 100%; }
      @media print {
        .no-print { display: none !important; }
        .bg-white { border: none !important; box-shadow: none !important; padding: 0 !important; }
        body { background: white !important; }
      }
    </style>
  `
})
export class InvoiceSummaryComponent implements OnInit {
    invoice = signal<any>(null);
    company = signal<any>(null);
    customer = signal<any>(null);

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private invoiceService: InvoiceService,
        private companyService: CompanyService,
        private contactService: ContactService
    ) { }

    async ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) {
            const inv = await this.invoiceService.getInvoiceById(id);
            if (inv) {
                this.invoice.set(inv);
                this.company.set(await this.companyService.getCompanyInfo());

                // Fetch specific customer details
                const resp = await this.contactService.getContacts({ first: 0, rows: 1000 });
                const cust = resp.data.find((c: any) => c.id === inv.customerId);
                this.customer.set(cust);
            } else {
                this.router.navigate(['/invoices']);
            }
        }
    }

    print() {
        window.print();
    }
}
