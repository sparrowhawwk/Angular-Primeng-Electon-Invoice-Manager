import { Component, signal, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InvoiceService } from '../../services/invoice.service';
import { ContactService } from '../../services/contact.service';
import { InventoryService } from '../../services/inventory.service';
import { CompanyService } from '../../services/company.service';

interface InvoiceItem {
  productId?: number;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DialogModule,
    ToastModule,
    DatePickerModule,
    AutoCompleteModule,
    SelectModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="p-6">
      <p-toast></p-toast>
      
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Invoices</h2>
      </div>

      <p-table 
        [value]="invoices()" 
        [lazy]="true" 
        (onLazyLoad)="loadInvoices($event)"
        [loading]="loading()"
        [rows]="10"
        [paginator]="true"
        [totalRecords]="totalRecords()"
        [globalFilterFields]="['invoiceNumber', 'customerName']"
        #dt
      >
        <ng-template #caption>
          <div class="flex justify-between items-center bg-gray-50 p-4">
            <p-button 
              label="Add New Invoice" 
              icon="pi pi-plus" 
              (onClick)="showDialog()"
            ></p-button>
            <p-iconfield iconPosition="left" class="ml-auto">
                <p-inputicon>
                    <i class="pi pi-search"></i>
                </p-inputicon>
                <input 
                pInputText 
                type="text" 
                (input)="dt.filterGlobal($any($event.target).value, 'contains')" 
                placeholder="Global Search" 
              />
            </p-iconfield>
          </div>
        </ng-template>
        <ng-template #header>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th style="width: 100px">Actions</th>
          </tr>
        </ng-template>
        <ng-template #body let-invoice>
          <tr>
            <td>{{ invoice.invoiceNumber }}</td>
            <td>{{ invoice.date | date }}</td>
            <td>{{ invoice.customerName }}</td>
            <td>{{ invoice.total | currency:'INR' }}</td>
            <td>
              <span [class]="'p-tag ' + (invoice.status === 'finalized' ? 'p-tag-success' : 'p-tag-info')">
                {{ invoice.status | titlecase }}
              </span>
            </td>
            <td>
              <div class="flex gap-2">
                <p-button 
                  icon="pi pi-eye" 
                  [rounded]="true" 
                  [text]="true" 
                  severity="info"
                  (onClick)="viewInvoice(invoice)"
                ></p-button>
                <p-button 
                  icon="pi pi-trash" 
                  [rounded]="true" 
                  [text]="true" 
                  severity="danger"
                  (onClick)="deleteInvoice(invoice)"
                ></p-button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Invoice Dialog -->
      <p-dialog 
        [header]="viewMode() ? (currentInvoiceNumber ? 'View Invoice: ' + currentInvoiceNumber : 'View Invoice') : (currentInvoiceId() ? 'Edit Invoice: ' + currentInvoiceNumber : 'Create New Invoice')" 
        [(visible)]="displayDialog" 
        [modal]="true" 
        [style]="{width: '900px'}"
        [draggable]="false"
        [resizable]="false"
      >
        <div class="flex flex-col gap-6 pt-4">
          <!-- Dates Section -->
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label class="font-medium text-sm">Invoice Date</label>
              <p-datepicker [(ngModel)]="invoiceDate" [showIcon]="true" appendTo="body" [disabled]="viewMode()"></p-datepicker>
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-medium text-sm">Due Date</label>
              <p-datepicker [(ngModel)]="dueDate" [showIcon]="true" appendTo="body" [disabled]="viewMode()"></p-datepicker>
            </div>
          </div>

          <!-- Customer Details -->
          <div class="grid grid-cols-2 gap-4 border-t pt-4">
            <div class="flex flex-col gap-2 col-span-2">
              <label class="font-medium text-sm">Customer Name</label>
              <p-autocomplete 
                [ngModel]="selectedCustomer()" 
                (ngModelChange)="selectedCustomer.set($event)"
                [suggestions]="filteredContacts" 
                (completeMethod)="searchContacts($event)"
                (onSelect)="onCustomerSelect($event)"
                optionLabel="name"
                placeholder="Search contact..."
                [style]="{width: '100%'}"
                [disabled]="viewMode()"
              ></p-autocomplete>
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-medium text-sm font-light text-gray-500">Contact Number</label>
              <input pInputText [ngModel]="customerPhone()" disabled />
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-medium text-sm font-light text-gray-500">Email</label>
              <input pInputText [ngModel]="customerEmail()" disabled />
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-medium text-sm font-light text-gray-500">GSTIN</label>
              <input pInputText [ngModel]="customerGstin()" disabled />
            </div>
            <div class="flex flex-col gap-2 col-span-2">
              <label class="font-medium text-sm text-gray-500">Primary Address</label>
              <textarea pTextarea [ngModel]="customerAddress1()" disabled rows="2"></textarea>
            </div>
            <div class="flex flex-col gap-2 col-span-2">
              <label class="font-medium text-sm text-gray-500">Secondary Address</label>
              <textarea pTextarea [ngModel]="customerAddress2()" disabled rows="2"></textarea>
            </div>
          </div>

          <!-- Invoice Items -->
          <div class="border-t pt-4">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-bold">Invoice Items</h3>
              <p-button label="Add Item" icon="pi pi-plus" [text]="true" (onClick)="addItem()" *ngIf="!viewMode()"></p-button>
            </div>
            
            <div class="flex flex-col gap-4">
              <div *ngFor="let item of items(); let i = index" class="grid grid-cols-12 gap-2 items-end border-b pb-4">
                <div class="col-span-3 flex flex-col gap-1">
                  <label class="text-xs">Product</label>
                  <p-select 
                    [options]="productList" 
                    [(ngModel)]="item.productId" 
                    optionLabel="name" 
                    optionValue="id"
                    (onChange)="onProductSelect(i, $event)"
                    placeholder="Select Product"
                    appendTo="body"
                    [disabled]="viewMode()"
                  ></p-select>
                </div>
                <div class="col-span-3 flex flex-col gap-1">
                  <label class="text-xs">Description</label>
                  <input pInputText [ngModel]="item.description" disabled />
                </div>
                <div class="col-span-1 flex flex-col gap-1">
                  <label class="text-xs">Qty</label>
                  <input pInputText type="number" [(ngModel)]="item.quantity" (ngModelChange)="calculateAmount(i)" [disabled]="viewMode()" />
                </div>
                <div class="col-span-2 flex flex-col gap-1">
                  <label class="text-xs">Unit Price</label>
                  <input pInputText [ngModel]="item.unitPrice" disabled />
                </div>
                <div class="col-span-2 flex flex-col gap-1">
                  <label class="text-xs">Amount</label>
                  <input pInputText [ngModel]="item.amount | number:'1.2-2'" disabled />
                </div>
                <div class="col-span-1 flex justify-end">
                   <p-button 
                    *ngIf="items().length > 1 && !viewMode()"
                    icon="pi pi-trash" 
                    [rounded]="true" 
                    [text]="true" 
                    severity="danger" 
                    (onClick)="removeItem(i)"
                  ></p-button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tax and Summary -->
          <div class="grid grid-cols-2 gap-4 border-t pt-4">
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-2">
                <label class="font-medium text-sm">Tax Type</label>
                <p-select [options]="taxTypes" [ngModel]="taxType()" (ngModelChange)="taxType.set($event)" appendTo="body" [disabled]="viewMode()"></p-select>
              </div>
              <div class="flex flex-col gap-2">
                <label class="font-medium text-sm">Tax Rate (%)</label>
                <p-select [options]="taxRates" [ngModel]="taxRate()" (ngModelChange)="taxRate.set($event)" appendTo="body" [disabled]="viewMode()"></p-select>
              </div>
            </div>
            <div class="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg">
               <div class="flex justify-between">
                 <span>Subtotal:</span>
                 <span class="font-bold">{{ subtotal() | currency:'INR' }}</span>
               </div>
               <div class="flex justify-between">
                 <span>Tax ({{taxRate()}}%):</span>
                 <span class="font-bold">{{ taxAmount() | currency:'INR' }}</span>
               </div>
               <div class="flex justify-between text-lg border-t pt-2 mt-2">
                 <span class="font-bold">Total:</span>
                 <span class="font-bold text-primary">{{ total() | currency:'INR' }}</span>
               </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="flex flex-col gap-2 border-t pt-4">
            <label class="font-medium text-sm">Additional Information</label>
            <textarea pTextarea [(ngModel)]="notes" rows="2" [disabled]="viewMode()"></textarea>
          </div>
        </div>

        <ng-template #footer>
          <div class="flex justify-end gap-2">
            <p-button 
              *ngIf="viewMode()"
              label="Print" 
              icon="pi pi-print" 
              (onClick)="printInvoice()"
            ></p-button>
            <p-button 
              label="Cancel" 
              [outlined]="true" 
              severity="secondary" 
              (onClick)="displayDialog = false"
            ></p-button>
            <p-button 
              *ngIf="!viewMode()"
              label="Draft" 
              [outlined]="true" 
              severity="secondary" 
              (onClick)="saveInvoice('draft')"
            ></p-button>
            <p-button 
              *ngIf="!viewMode()"
              label="Finalize" 
              icon="pi pi-check" 
              (onClick)="saveInvoice('finalized')"
            ></p-button>
          </div>
        </ng-template>
      </p-dialog>

      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styles: `
    :host { display: block; height: 100%; background-color: var(--surface-ground); }
    ::ng-deep .p-datatable-header { background: transparent; padding: 0; border: none; }
  `,
})
export class InvoicesComponent implements OnInit {
  invoices = signal<any[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  displayDialog = false;
  viewMode = signal(false);
  currentInvoiceId = signal<number | undefined>(undefined);
  currentInvoiceNumber = '';

  // Form Fields
  invoiceDate = new Date();
  dueDate = new Date();
  selectedCustomer = signal<any>(null);
  items = signal<InvoiceItem[]>([{ productName: '', description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  taxType = signal('GST');
  taxRate = signal(18);
  notes = '';

  taxTypes = ['GST', 'IGST'];
  taxRates = Array.from({ length: 31 }, (_, i) => 3 + i * 0.5);

  // Suggestions
  filteredContacts: any[] = [];
  productList: any[] = [];

  // Computed fields
  customerPhone = computed(() => this.selectedCustomer()?.phone || '');
  customerEmail = computed(() => this.selectedCustomer()?.email || '');
  customerGstin = computed(() => this.selectedCustomer()?.gstin || '');
  customerAddress1 = computed(() => this.selectedCustomer()?.address1 || '');
  customerAddress2 = computed(() => this.selectedCustomer()?.address2 || '');

  subtotal = computed(() => this.items().reduce((sum, item) => sum + item.amount, 0));
  taxAmount = computed(() => this.subtotal() * (this.taxRate() / 100));
  total = computed(() => this.subtotal() + this.taxAmount());

  constructor(
    private invoiceService: InvoiceService,
    private contactService: ContactService,
    private inventoryService: InventoryService,
    private companyService: CompanyService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    this.loadProductsForSelection();
  }

  async loadInvoices(event?: TableLazyLoadEvent) {
    this.loading.set(true);
    try {
      const options = {
        globalFilter: Array.isArray(event?.globalFilter) ? event.globalFilter[0] : (event?.globalFilter as string || ''),
        first: event?.first || 0,
        rows: event?.rows || 10
      };
      const response = await this.invoiceService.getInvoices(options);
      this.invoices.set(response.data);
      this.totalRecords.set(response.totalRecords);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadProductsForSelection() {
    const response = await this.inventoryService.getProducts({ first: 0, rows: 1000 });
    this.productList = response.data;
  }

  async searchContacts(event: any) {
    const response = await this.contactService.getContacts({ globalFilter: event.query, first: 0, rows: 10 });
    this.filteredContacts = response.data;
  }

  onCustomerSelect(event: any) {
    this.selectedCustomer.set(event.value);
  }

  onProductSelect(index: number, event: any) {
    const product = this.productList.find(p => p.id === event.value);
    if (product) {
      const newItems = [...this.items()];
      newItems[index].productName = product.name;
      newItems[index].description = product.description;
      newItems[index].unitPrice = product.unitPrice;
      newItems[index].amount = newItems[index].quantity * product.unitPrice;
      this.items.set(newItems);
    }
  }

  addItem() {
    this.items.update(prev => [...prev, { productName: '', description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  }

  removeItem(index: number) {
    if (this.items().length > 1) {
      this.items.update(prev => prev.filter((_, i) => i !== index));
    }
  }

  calculateAmount(index: number) {
    const newItems = [...this.items()];
    newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
    this.items.set(newItems);
  }

  showDialog() {
    this.viewMode.set(false);
    this.currentInvoiceId.set(undefined);
    this.currentInvoiceNumber = '';
    this.invoiceDate = new Date();
    this.dueDate = new Date();
    this.selectedCustomer.set(null);
    this.items.set([{ productName: '', description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
    this.taxType.set('GST');
    this.taxRate.set(18);
    this.notes = '';
    this.displayDialog = true;
  }

  viewInvoice(invoice: any) {
    if (invoice.status === 'finalized') {
      this.router.navigate(['/invoices/view', invoice.id]);
      return;
    }

    this.viewMode.set(false); // Editable if 'draft'
    this.currentInvoiceId.set(invoice.id);
    this.currentInvoiceNumber = invoice.invoiceNumber;
    this.invoiceDate = new Date(invoice.date);
    this.dueDate = new Date(invoice.dueDate);

    // Find customer for autocomplete display
    this.contactService.getContacts({ first: 0, rows: 1000 }).then(resp => {
      const customer = resp.data.find((c: any) => c.id === invoice.customerId);
      this.selectedCustomer.set(customer);
    });

    this.items.set([...invoice.items]);
    this.taxType.set(invoice.taxType);
    this.taxRate.set(invoice.taxRate);
    this.notes = invoice.notes;
    this.displayDialog = true;
  }

  async printInvoice() {
    const customer = this.selectedCustomer();
    const company = await this.companyService.getCompanyInfo();

    // Create hidden iframe for printing
    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }

    const itemsHtml = this.items().map(item => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.unitPrice.toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.amount.toFixed(2)}</td>
        </tr>
    `).join('');

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
        <html>
            <head>
                <title>Invoice - ${this.currentInvoiceNumber}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
                    .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
                    .invoice-title { font-size: 32px; font-weight: bold; color: #2563eb; }
                    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                    .section-title { color: #666; font-size: 12px; text-transform: uppercase; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                    th { background-color: #f8fafc; padding: 12px 8px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 13px; }
                    td { font-size: 13px; }
                    .summary { display: flex; flex-direction: column; align-items: flex-end; }
                    .summary-row { display: flex; justify-content: space-between; width: 250px; padding: 6px 0; font-size: 14px; }
                    .total-row { border-top: 2px solid #2563eb; margin-top: 8px; padding-top: 12px; font-weight: bold; font-size: 18px; color: #2563eb; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="invoice-title">INVOICE</div>
                        <div style="margin-top: 4px; font-size: 14px; color: #666;"># ${this.currentInvoiceNumber}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; font-size: 18px;">${company?.name || 'Your Company'}</div>
                        <div style="font-size: 12px; color: #666;">
                            ${company?.address || ''}<br>
                            ${company?.email || ''} | ${company?.phone || ''}<br>
                            GSTIN: ${company?.gstin || ''}
                        </div>
                    </div>
                </div>

                <div class="details">
                    <div class="customer-info">
                        <div class="section-title">Bill To</div>
                        <div style="font-weight: bold; font-size: 16px;">${customer?.name || 'N/A'}</div>
                        <div style="color: #444; margin-top: 4px;">
                            ${customer?.address1 || ''}<br>
                            ${customer?.address2 || ''}<br>
                            ${customer?.phone || ''}<br>
                            ${customer?.email || ''}
                        </div>
                        <div style="margin-top: 8px; font-size: 12px;">GSTIN: ${customer?.gstin || ''}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="section-title">Invoice Details</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: right;">
                            <span style="color: #666;">Invoice Date:</span>
                            <span style="font-weight: bold;">${this.invoiceDate.toLocaleDateString()}</span>
                            <span style="color: #666;">Due Date:</span>
                            <span style="font-weight: bold;">${this.dueDate.toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Description</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="summary">
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>₹ ${this.subtotal().toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Tax (${this.taxType()} ${this.taxRate()}%):</span>
                        <span>₹ ${this.taxAmount().toFixed(2)}</span>
                    </div>
                    <div class="summary-row total-row">
                        <span>Total Amount:</span>
                        <span>₹ ${this.total().toFixed(2)}</span>
                    </div>
                </div>

                ${this.notes ? `
                    <div style="margin-top: 40px; background-color: #f8fafc; padding: 15px; border-radius: 4px;">
                        <div class="section-title">Notes / Additional Information</div>
                        <div style="white-space: pre-wrap; font-size: 12px; color: #444;">${this.notes}</div>
                    </div>
                ` : ''}

                <div style="margin-top: 60px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 20px;">
                    Thank you for your business!
                </div>
            </body>
        </html>
    `);
    doc.close();

    // Trigger print
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 500);
  }

  async saveInvoice(status: 'draft' | 'finalized') {
    const customer = this.selectedCustomer();
    if (!customer) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please select a customer' });
      return;
    }

    const invoice = {
      id: this.currentInvoiceId(),
      invoiceNumber: this.currentInvoiceNumber || undefined,
      date: this.invoiceDate,
      dueDate: this.dueDate,
      customerId: customer.id,
      customerName: customer.name,
      items: this.items(),
      taxType: this.taxType(),
      taxRate: this.taxRate(),
      subtotal: this.subtotal(),
      taxAmount: this.taxAmount(),
      total: this.total(),
      notes: this.notes,
      status: status
    };

    try {
      const response = await this.invoiceService.saveInvoice(invoice);
      if (response && response.success) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `Invoice saved as ${status}` });
        this.displayDialog = false;
        this.loadInvoices();
      } else {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: response.error || 'Failed to save invoice' });
      }
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'An error occurred' });
    }
  }

  deleteInvoice(invoice: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete invoice ${invoice.invoiceNumber}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const response = await this.invoiceService.deleteInvoice(invoice.id);
          if (response && response.success) {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Invoice deleted successfully' });
            this.loadInvoices();
          }
        } catch (error) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete' });
        }
      }
    });
  }
}
