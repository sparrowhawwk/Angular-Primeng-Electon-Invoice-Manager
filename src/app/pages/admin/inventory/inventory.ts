import { Component, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { InventoryService } from '../../../services/inventory.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { KeyFilterModule } from 'primeng/keyfilter';
import { InventoryChartComponent } from './inventory-chart.component';

@Component({
  selector: 'app-inventory',
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
    IconFieldModule,
    InputIconModule,
    ConfirmDialogModule,
    KeyFilterModule,
    InventoryChartComponent
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="p-6">
      <p-toast></p-toast>
      
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Inventory Management</h2>
      </div>

      <app-inventory-chart></app-inventory-chart>

      <p-table 
        [value]="products()" 
        [lazy]="true" 
        (onLazyLoad)="loadProducts($event)"
        [loading]="loading()"
        [rows]="10"
        [paginator]="true"
        [totalRecords]="totalRecords()"
        [globalFilterFields]="['name', 'description']"
        #dt
        filterDisplay="menu"
        stripedRows
        [scrollable]="true"
        [scrollHeight]="tableHeight()"
      >
        <ng-template #caption>
          <div class="flex justify-between items-center bg-gray-50 p-4">
            <p-button 
              label="Add New Product" 
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
            <th pSortableColumn="name">
              <div class="flex items-center gap-2">
                Name <p-sortIcon field="name"></p-sortIcon>
                <p-columnFilter type="text" field="name" display="menu" class="ml-auto"></p-columnFilter>
              </div>
            </th>
            <th pSortableColumn="description">
              <div class="flex items-center gap-2">
                Description <p-sortIcon field="description"></p-sortIcon>
              </div>
            </th>
            <th pSortableColumn="totalUnits">
              <div class="flex items-center gap-2">
                Total Units <p-sortIcon field="totalUnits"></p-sortIcon>
              </div>
            </th>
            <th pSortableColumn="unitPrice">
              <div class="flex items-center gap-2">
                Unit Price <p-sortIcon field="unitPrice"></p-sortIcon>
              </div>
            </th>
            <th style="width: 100px">Actions</th>
          </tr>
        </ng-template>
        <ng-template #body let-product>
          <tr>
            <td>{{ product.name }}</td>
            <td>{{ product.description }}</td>
            <td>{{ product.totalUnits }}</td>
            <td>{{ product.unitPrice | currency:'INR' }}</td>
            <td>
              <div class="flex gap-2">
                <p-button 
                  icon="pi pi-eye" 
                  [rounded]="true" 
                  [text]="true" 
                  severity="info"
                  (onClick)="viewProduct(product)"
                ></p-button>
                <p-button 
                  icon="pi pi-pencil" 
                  [rounded]="true" 
                  [text]="true" 
                  severity="secondary"
                  (onClick)="editProduct(product)"
                ></p-button>
                <p-button 
                  icon="pi pi-trash" 
                  [rounded]="true" 
                  [text]="true" 
                  severity="danger"
                  (onClick)="deleteProduct(product)"
                ></p-button>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="5" class="text-center p-4">No products found.</td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Create/Edit Product Dialog -->
      <p-dialog 
        [header]="viewMode() ? 'View Product' : (currentProductId() ? 'Edit Product' : 'Add New Product')" 
        [(visible)]="displayDialog" 
        [modal]="true" 
        [style]="{width: '600px'}"
        [draggable]="false"
        [resizable]="false"
      >
        <div class="grid grid-cols-2 gap-4 pt-4">
          <!-- Name -->
          <div class="flex flex-col gap-2">
            <label for="name" class="font-medium">Name</label>
            <input pInputText id="name" [ngModel]="productName()" (ngModelChange)="productName.set($event)" [disabled]="viewMode()" />
          </div>

          <!-- Total Units -->
          <div class="flex flex-col gap-2">
            <label for="totalUnits" class="font-medium">Total Units</label>
            <input pInputText id="totalUnits" pKeyFilter="int" [ngModel]="productTotalUnits()" (ngModelChange)="productTotalUnits.set($event)" [disabled]="viewMode()" />
          </div>

          <!-- Unit Price -->
          <div class="flex flex-col gap-2">
            <label for="unitPrice" class="font-medium">Unit Price</label>
            <input pInputText id="unitPrice" pKeyFilter="num" [ngModel]="productUnitPrice()" (ngModelChange)="productUnitPrice.set($event)" [disabled]="viewMode()" />
          </div>

          <!-- Description -->
          <div class="flex flex-col gap-2 col-span-2">
            <label for="description" class="font-medium">Description</label>
            <textarea pTextarea id="description" [ngModel]="productDescription()" (ngModelChange)="productDescription.set($event)" rows="3" [disabled]="viewMode()"></textarea>
          </div>
        </div>

        <ng-template #footer>
          <p-button 
            label="Cancel" 
            icon="pi pi-times" 
            [text]="true" 
            (onClick)="displayDialog = false"
            variant="outlined"
            severity="secondary"
          ></p-button>
          @if (!viewMode()) {
            <p-button 
              label="Save" 
              icon="pi pi-check" 
              (onClick)="saveProduct()"
            ></p-button>
          }
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
export class InventoryComponent implements OnInit {
  products = signal<any[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  displayDialog = false;
  viewMode = signal(false);

  productName = signal('');
  productDescription = signal('');
  productTotalUnits = signal<any>('');
  productUnitPrice = signal<any>('');
  currentProductId = signal<number | undefined>(undefined);
  tableHeight = signal<string>('500px');

  constructor(
    private inventoryService: InventoryService,
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

  async loadProducts(event?: TableLazyLoadEvent) {
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
      const response = await this.inventoryService.getProducts(options);
      this.products.set(response.data);
      this.totalRecords.set(response.totalRecords);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      this.loading.set(false);
    }
  }

  showDialog() {
    this.viewMode.set(false);
    this.currentProductId.set(undefined);
    this.productName.set('');
    this.productDescription.set('');
    this.productTotalUnits.set('');
    this.productUnitPrice.set('');
    this.displayDialog = true;
  }

  viewProduct(product: any) {
    this.currentProductId.set(product.id);
    this.productName.set(product.name);
    this.productDescription.set(product.description);
    this.productTotalUnits.set(product.totalUnits);
    this.productUnitPrice.set(product.unitPrice);
    this.viewMode.set(true);
    this.displayDialog = true;
  }

  editProduct(product: any) {
    this.viewMode.set(false);
    this.currentProductId.set(product.id);
    this.productName.set(product.name);
    this.productDescription.set(product.description);
    this.productTotalUnits.set(product.totalUnits);
    this.productUnitPrice.set(product.unitPrice);
    this.displayDialog = true;
  }

  deleteProduct(product: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${product.name}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const response = await this.inventoryService.deleteProduct(product.id);
          if (response && response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Product deleted successfully'
            });
            this.loadProducts();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.error || 'Failed to delete product'
            });
          }
        } catch (error) {
          console.error('Error deleting product:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'An error occurred while deleting'
          });
        }
      }
    });
  }

  async saveProduct() {
    if (!this.productName()) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Name is required' });
      return;
    }

    const product = {
      id: this.currentProductId(),
      name: this.productName(),
      description: this.productDescription(),
      totalUnits: this.productTotalUnits(),
      unitPrice: this.productUnitPrice()
    };

    try {
      const response = await this.inventoryService.saveProduct(product);
      if (response && response.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Product saved successfully'
        });
        this.displayDialog = false;
        this.loadProducts();
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save product'
        });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while saving'
      });
    }
  }
}
