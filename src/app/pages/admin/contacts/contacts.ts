import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ContactService } from '../../../services/contact.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-contacts',
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
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="p-6">
      <p-toast></p-toast>
      
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Contacts Management</h2>
      </div>

      <p-table 
        [value]="contacts()" 
        [lazy]="true" 
        (onLazyLoad)="loadContacts($event)"
        [loading]="loading()"
        [rows]="10"
        [paginator]="true"
        [totalRecords]="totalRecords()"
        [globalFilterFields]="['name', 'email', 'phone', 'gstin']"
        #dt
      >
        <ng-template #caption>
          <div class="flex justify-between items-center bg-gray-50 p-4">
            <p-button 
              label="Create New Contact" 
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
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>GSTIN</th>
            <th style="width: 100px">Actions</th>
          </tr>
        </ng-template>
        <ng-template #body let-contact>
          <tr>
            <td>{{ contact.name }}</td>
            <td>{{ contact.phone }}</td>
            <td>{{ contact.email }}</td>
            <td>{{ contact.gstin }}</td>
            <td>
              <div class="flex gap-2">
                <p-button 
                  icon="pi pi-eye" 
                  [rounded]="true" 
                  [text]="true" 
                  severity="info"
                  (onClick)="viewContact(contact)"
                ></p-button>
                <p-button 
                  icon="pi pi-pencil" 
                  [rounded]="true" 
                  [text]="true" 
                  severity="secondary"
                  (onClick)="editContact(contact)"
                ></p-button>
                <p-button 
                  icon="pi pi-trash" 
                  [rounded]="true" 
                  [text]="true" 
                  severity="danger"
                  (onClick)="deleteContact(contact)"
                ></p-button>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="5" class="text-center p-4">No contacts found.</td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Create Contact Dialog -->
      <p-dialog 
        [header]="viewMode() ? 'View Contact' : (contactForm().id ? 'Edit Contact' : 'Create New Contact')" 
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
            <input pInputText id="name" [(ngModel)]="contactForm().name" [disabled]="viewMode()" />
          </div>

          <!-- Phone Number -->
          <div class="flex flex-col gap-2">
            <label for="phone" class="font-medium">Phone Number</label>
            <input pInputText id="phone" [(ngModel)]="contactForm().phone" [disabled]="viewMode()" />
          </div>

          <!-- Email Address -->
          <div class="flex flex-col gap-2">
            <label for="email" class="font-medium">Email Address</label>
            <input pInputText id="email" [(ngModel)]="contactForm().email" [disabled]="viewMode()" />
          </div>

          <!-- GSTIN -->
          <div class="flex flex-col gap-2">
            <label for="gstin" class="font-medium">GSTIN</label>
            <input pInputText id="gstin" [(ngModel)]="contactForm().gstin" [disabled]="viewMode()" />
          </div>

          <!-- Primary Address -->
          <div class="flex flex-col gap-2 col-span-2">
            <label for="address1" class="font-medium">Primary Address</label>
            <textarea pTextarea id="address1" [(ngModel)]="contactForm().address1" rows="3" [disabled]="viewMode()"></textarea>
          </div>

          <!-- Secondary Address -->
          <div class="flex flex-col gap-2 col-span-2">
            <label for="address2" class="font-medium">Secondary Address</label>
            <textarea pTextarea id="address2" [(ngModel)]="contactForm().address2" rows="3" [disabled]="viewMode()"></textarea>
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
              (onClick)="saveContact()"
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
export class ContactsComponent implements OnInit {
  contacts = signal<any[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  displayDialog = false;
  viewMode = signal(false);

  contactForm = signal({
    id: undefined as number | undefined,
    name: '',
    phone: '',
    email: '',
    gstin: '',
    address1: '',
    address2: ''
  });

  constructor(
    private contactService: ContactService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    // Initial load will be handled by p-table's onLazyLoad
  }

  async loadContacts(event?: TableLazyLoadEvent) {
    this.loading.set(true);
    try {
      const options = {
        globalFilter: Array.isArray(event?.globalFilter) ? event.globalFilter[0] : (event?.globalFilter as string || ''),
        first: event?.first || 0,
        rows: event?.rows || 10
      };
      const response = await this.contactService.getContacts(options);
      this.contacts.set(response.data);
      this.totalRecords.set(response.totalRecords);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      this.loading.set(false);
    }
  }

  showDialog() {
    this.viewMode.set(false);
    this.contactForm.set({
      id: undefined,
      name: '',
      phone: '',
      email: '',
      gstin: '',
      address1: '',
      address2: ''
    });
    this.displayDialog = true;
  }

  viewContact(contact: any) {
    this.contactForm.set({ ...contact });
    this.viewMode.set(true);
    this.displayDialog = true;
  }

  editContact(contact: any) {
    this.viewMode.set(false);
    this.contactForm.set({ ...contact });
    this.displayDialog = true;
  }

  deleteContact(contact: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${contact.name}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const response = await this.contactService.deleteContact(contact.id);
          if (response && response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Contact deleted successfully'
            });
            this.loadContacts();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.error || 'Failed to delete contact'
            });
          }
        } catch (error) {
          console.error('Error deleting contact:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'An error occurred while deleting'
          });
        }
      }
    });
  }

  async saveContact() {
    if (!this.contactForm().name) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Name is required' });
      return;
    }

    try {
      const response = await this.contactService.saveContact(this.contactForm());
      if (response && response.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Contact saved successfully'
        });
        this.displayDialog = false;
        this.loadContacts();
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save contact'
        });
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while saving'
      });
    }
  }
}

