import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InvoiceSettingsService } from '../../../services/invoice-settings.service';

@Component({
  selector: 'app-invoice-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="p-6">
      <p-toast></p-toast>
      <h2 class="text-2xl font-bold mb-6">Invoice Settings</h2>
      
      <div class="grid grid-cols-2 gap-4">
        <!-- Invoice Prefix -->
        <div class="flex flex-col gap-2">
          <label for="prefix" class="font-medium">Invoice Prefix</label>
          <input pInputText id="prefix" [(ngModel)]="invoiceSettings().prefix" placeholder="e.g. INV-" />
        </div>

        <!-- Default Tax Rate (%) -->
        <div class="flex flex-col gap-2">
          <label for="defaultTaxRate" class="font-medium">Default Tax Rate (%)</label>
          <input pInputText id="defaultTaxRate" [(ngModel)]="invoiceSettings().defaultTaxRate" type="text" />
        </div>

        <!-- Terms & Conditions -->
        <div class="flex flex-col gap-2 col-span-2">
          <label for="terms" class="font-medium">Terms & Conditions</label>
          <textarea pTextarea id="terms" [(ngModel)]="invoiceSettings().termsAndConditions" rows="3"></textarea>
        </div>

        <!-- Footer Notes -->
        <div class="flex flex-col gap-2 col-span-2">
          <label for="notes" class="font-medium">Footer Notes</label>
          <textarea pTextarea id="notes" [(ngModel)]="invoiceSettings().notes" rows="3"></textarea>
        </div>

        <!-- Save Button -->
        <div class="col-span-2 flex justify-end mt-4">
          <p-button label="Save" icon="pi pi-check" (onClick)="saveInvoiceSettings()"></p-button>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      background-color: var(--surface-ground);
    }
  `,
})
export class InvoiceSettingsComponent implements OnInit {
  invoiceSettings = signal({
    prefix: 'INV-',
    defaultTaxRate: '18',
    termsAndConditions: '',
    notes: ''
  });

  constructor(
    private messageService: MessageService,
    private invoiceSettingsService: InvoiceSettingsService
  ) { }

  async ngOnInit() {
    const data = await this.invoiceSettingsService.getInvoiceSettings();
    if (data) {
      this.invoiceSettings.set(data);
    }
  }

  async saveInvoiceSettings() {
    try {
      const response = await this.invoiceSettingsService.saveInvoiceSettings(this.invoiceSettings());
      
      if (response && response.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Invoice settings saved successfully'
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save invoice settings'
        });
      }
    } catch (error) {
      console.error('Error in saveInvoiceSettings:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while saving'
      });
    }
  }
}
