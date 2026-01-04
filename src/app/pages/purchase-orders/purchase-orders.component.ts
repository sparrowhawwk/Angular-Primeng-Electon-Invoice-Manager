import { Component, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { KeyFilterModule } from 'primeng/keyfilter';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PurchaseChartComponent } from './purchase-chart.component';

@Component({
  selector: 'app-purchase-orders',
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
    KeyFilterModule,
    IconFieldModule,
    InputIconModule,
    ConfirmDialogModule,
    PurchaseChartComponent
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="p-6">
      <p-toast></p-toast>
      
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Purchase Orders</h2>
      </div>

      <app-purchase-chart></app-purchase-chart>

      <p-table 
        [value]="purchaseOrders()" 
        [lazy]="true" 
        (onLazyLoad)="loadPurchaseOrders($event)"
        [loading]="loading()"
        [rows]="10"
        [paginator]="true"
        [totalRecords]="totalRecords()"
        [globalFilterFields]="['sellerName', 'sellerGst', 'notes']"
        #dt
        filterDisplay="menu"
        stripedRows
        [scrollable]="true"
        [scrollHeight]="tableHeight()"
      >
        <ng-template #caption>
          <div class="flex justify-between items-center bg-gray-50 p-4">
            <p-button 
              label="Add New Purchase Order" 
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
                class="p-inputtext-sm"
              />
            </p-iconfield>
          </div>
        </ng-template>
        <ng-template #header>
          <tr>
            <th pSortableColumn="purchaseDate">
              <div class="flex items-center gap-2">
                Date <p-sortIcon field="purchaseDate"></p-sortIcon>
              </div>
            </th>
            <th pSortableColumn="sellerName">
              <div class="flex items-center gap-2">
                Seller Name <p-sortIcon field="sellerName"></p-sortIcon>
                <p-columnFilter type="text" field="sellerName" display="menu" class="ml-auto"></p-columnFilter>
              </div>
            </th>
            <th pSortableColumn="sellerGst">
              <div class="flex items-center gap-2">
                GSTIN <p-sortIcon field="sellerGst"></p-sortIcon>
              </div>
            </th>
            <th pSortableColumn="price">
              <div class="flex items-center gap-2">
                Price <p-sortIcon field="price"></p-sortIcon>
              </div>
            </th>
            <th pSortableColumn="taxPercentage">
              <div class="flex items-center gap-2">
                Tax % <p-sortIcon field="taxPercentage"></p-sortIcon>
              </div>
            </th>
            <th style="width: 100px">Actions</th>
          </tr>
        </ng-template>
        <ng-template #body let-po>
          <tr>
            <td>{{ po.purchaseDate | date:'mediumDate' }}</td>
            <td>{{ po.sellerName }}</td>
            <td>{{ po.sellerGst }}</td>
            <td>{{ po.price | currency:'INR' }}</td>
            <td>{{ po.taxPercentage }}%</td>
            <td>
              <div class="flex gap-2">
                <p-button 
                  icon="pi pi-pencil" 
                  [rounded]="true" 
                  [text]="true" 
                  severity="secondary"
                  (onClick)="editPurchaseOrder(po)"
                ></p-button>
                <p-button 
                  icon="pi pi-trash" 
                  [rounded]="true" 
                  [text]="true" 
                  severity="danger"
                  (onClick)="deletePurchaseOrder(po)"
                ></p-button>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="6" class="text-center p-4">No purchase orders found.</td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Purchase Order Dialog -->
      <p-dialog 
        [header]="currentPoId() ? 'Edit Purchase Order' : 'Add New Purchase Order'" 
        [(visible)]="displayDialog" 
        [modal]="true" 
        [style]="{width: '700px'}"
        [draggable]="false"
        [resizable]="false"
      >
        <!-- Purchase Order Dates Section -->
        <h3 class="text-lg font-semibold mb-2 mt-4">Purchase Order Dates Section</h3>
        <div class="grid grid-cols-2 gap-4 pb-4">
            <div class="flex flex-col gap-2">
                <label for="purchaseDate" class="font-medium">Purchase date</label>
                <p-datepicker id="purchaseDate" [ngModel]="purchaseDate()" (ngModelChange)="purchaseDate.set($event)" [showIcon]="true" appendTo="body"></p-datepicker>
            </div>
        </div>

        <!-- Seller Details -->
        <h3 class="text-lg font-semibold mb-2 mt-2">Seller Details</h3>
        <div class="grid grid-cols-2 gap-4 pt-2">
            <!-- Name -->
            <div class="flex flex-col gap-2">
                <label for="sellerName" class="font-medium">Name</label>
                <input pInputText id="sellerName" [ngModel]="sellerName()" (ngModelChange)="sellerName.set($event)" />
            </div>

            <!-- GSTIN -->
            <div class="flex flex-col gap-2">
                <label for="sellerGst" class="font-medium">GSTIN</label>
                <input pInputText id="sellerGst" [ngModel]="sellerGst()" (ngModelChange)="sellerGst.set($event)" />
            </div>

            <!-- price -->
            <div class="flex flex-col gap-2">
                <label for="price" class="font-medium">Price</label>
                <input pInputText id="price" pKeyFilter="num" [ngModel]="price()" (ngModelChange)="price.set($event)" />
            </div>

            <!-- Tax percentage -->
            <div class="flex flex-col gap-2">
                <label for="taxPercentage" class="font-medium">Tax percentage</label>
                <input pInputText id="taxPercentage" pKeyFilter="num" [ngModel]="taxPercentage()" (ngModelChange)="taxPercentage.set($event)" />
            </div>

            <!-- Notes (optional) -->
            <div class="flex flex-col gap-2 col-span-2 mt-2">
                <h3 class="text-lg font-semibold mb-2">Notes (optional)</h3>
                <label for="notes" class="font-medium">Additional Information</label>
                <textarea pTextarea id="notes" [ngModel]="notes()" (ngModelChange)="notes.set($event)" rows="3"></textarea>
            </div>
        </div>

        <ng-template #footer>
          <p-button 
            label="Cancel" 
            icon="pi pi-times" 
            [text]="true" 
            (onClick)="displayDialog = false"
            severity="secondary"
          ></p-button>
          <p-button 
            label="Save" 
            icon="pi pi-check" 
            (onClick)="savePurchaseOrder()"
          ></p-button>
        </ng-template>
      </p-dialog>

      <p-confirmDialog #cd>
        <ng-template #footer>
          <p-button 
            label="No" 
            (onClick)="cd.onReject()" 
            variant="outlined" 
            severity="secondary"
          ></p-button>
          <p-button 
            label="Yes" 
            (onClick)="cd.onAccept()" 
          ></p-button>
        </ng-template>
      </p-confirmDialog>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      background-color: var(--surface-ground);
    }
    ::ng-deep .p-datatable-header {
      background: transparent;
      padding: 0;
      border: none;
    }
  `,
})
export class PurchaseOrdersComponent implements OnInit {
  purchaseOrders = signal<any[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  displayDialog = false;

  currentPoId = signal<number | undefined>(undefined);
  purchaseDate = signal<Date>(new Date());
  sellerName = signal('');
  sellerGst = signal('');
  price = signal<any>('');
  taxPercentage = signal<any>('');
  notes = signal('');
  tableHeight = signal<string>('500px');

  constructor(
    private poService: PurchaseOrderService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    this.calculateHeight();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.calculateHeight();
  }

  calculateHeight() {
    const windowHeight = window.innerHeight;
    // Offset for header (60), page title (60), chart (200), captions/header (120), padding (40)
    const offset = 480;
    const height = Math.max(300, windowHeight - offset);
    this.tableHeight.set(`${height}px`);
  }

  async loadPurchaseOrders(event?: TableLazyLoadEvent) {
    this.loading.set(true);
    try {
      const options = {
        globalFilter: Array.isArray(event?.globalFilter) ? event.globalFilter[0] : (event?.globalFilter as string || ''),
        first: event?.first || 0,
        rows: event?.rows || 10,
        filters: event?.filters,
        sortField: event?.sortField as string,
        sortOrder: event?.sortOrder as number
      };
      const response = await this.poService.getPurchaseOrders(options);
      this.purchaseOrders.set(response.data);
      this.totalRecords.set(response.totalRecords);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    } finally {
      this.loading.set(false);
    }
  }

  showDialog() {
    this.currentPoId.set(undefined);
    this.purchaseDate.set(new Date());
    this.sellerName.set('');
    this.sellerGst.set('');
    this.price.set('');
    this.taxPercentage.set('');
    this.notes.set('');
    this.displayDialog = true;
  }

  editPurchaseOrder(po: any) {
    this.currentPoId.set(po.id);
    this.purchaseDate.set(po.purchaseDate ? new Date(po.purchaseDate) : new Date());
    this.sellerName.set(po.sellerName || '');
    this.sellerGst.set(po.sellerGst || '');
    this.price.set(po.price || '');
    this.taxPercentage.set(po.taxPercentage || '');
    this.notes.set(po.notes || '');
    this.displayDialog = true;
  }

  async savePurchaseOrder() {
    if (!this.sellerName() || !this.purchaseDate()) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Seller name and Date are required' });
      return;
    }

    const purchase = {
      id: this.currentPoId(),
      purchaseDate: this.purchaseDate(),
      sellerName: this.sellerName(),
      sellerGst: this.sellerGst(),
      price: this.price(),
      taxPercentage: this.taxPercentage(),
      notes: this.notes()
    };

    try {
      const response = await this.poService.savePurchaseOrder(purchase);
      if (response && response.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Purchase order saved successfully'
        });
        this.displayDialog = false;
        this.loadPurchaseOrders();
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: response.error || 'Failed to save purchase order'
        });
      }
    } catch (error) {
      console.error('Error saving purchase order:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while saving'
      });
    }
  }

  deletePurchaseOrder(po: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this purchase order from ${po.sellerName}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const response = await this.poService.deletePurchaseOrder(po.id);
          if (response && response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Purchase order deleted successfully'
            });
            this.loadPurchaseOrders();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.error || 'Failed to delete purchase order'
            });
          }
        } catch (error) {
          console.error('Error deleting purchase order:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'An error occurred while deleting'
          });
        }
      }
    });
  }
}
