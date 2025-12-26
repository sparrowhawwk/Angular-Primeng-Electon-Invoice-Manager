import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CompanyService } from '../../../services/company.service';

@Component({
  selector: 'app-company',
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
      <h2 class="text-2xl font-bold mb-6">Company Information</h2>
      
      <div class="grid grid-cols-2 gap-4">
        <!-- Name -->
        <div class="flex flex-col gap-2">
          <label for="name" class="font-medium">Name</label>
          <input pInputText id="name" [(ngModel)]="companyInfo().name" />
        </div>

        <!-- Phone Number -->
        <div class="flex flex-col gap-2">
          <label for="phone" class="font-medium">Phone Number</label>
          <input pInputText id="phone" [(ngModel)]="companyInfo().phone" />
        </div>

        <!-- Email Address -->
        <div class="flex flex-col gap-2">
          <label for="email" class="font-medium">Email Address</label>
          <input pInputText id="email" [(ngModel)]="companyInfo().email" />
        </div>

        <!-- GSTIN -->
        <div class="flex flex-col gap-2">
          <label for="gstin" class="font-medium">GSTIN</label>
          <input pInputText id="gstin" [(ngModel)]="companyInfo().gstin" />
        </div>

        <!-- Bank Name -->
        <div class="flex flex-col gap-2">
          <label for="bankName" class="font-medium">Bank Name</label>
          <input pInputText id="bankName" [(ngModel)]="companyInfo().bankName" />
        </div>

        <!-- IFSC Number -->
        <div class="flex flex-col gap-2">
          <label for="ifsc" class="font-medium">IFSC Number</label>
          <input pInputText id="ifsc" [(ngModel)]="companyInfo().ifsc" />
        </div>

        <!-- Primary Address -->
        <div class="flex flex-col gap-2 col-span-2">
          <label for="address1" class="font-medium">Primary Address</label>
          <textarea pTextarea id="address1" [(ngModel)]="companyInfo().address1" rows="3"></textarea>
        </div>

        <!-- Secondary Address -->
        <div class="flex flex-col gap-2 col-span-2">
          <label for="address2" class="font-medium">Secondary Address</label>
          <textarea pTextarea id="address2" [(ngModel)]="companyInfo().address2" rows="3"></textarea>
        </div>

        <!-- Message -->
        <div class="flex flex-col gap-2 col-span-2">
          <label for="message" class="font-medium">Message</label>
          <textarea pTextarea id="message" [(ngModel)]="companyInfo().message" rows="3"></textarea>
        </div>

        <!-- Save Button -->
        <div class="col-span-2 flex justify-end mt-4">
          <p-button label="Save" icon="pi pi-check" (onClick)="saveCompanyInfo()"></p-button>
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
export class CompanyComponent implements OnInit {
  companyInfo = signal({
    name: '',
    phone: '',
    email: '',
    gstin: '',
    bankName: '',
    ifsc: '',
    address1: '',
    address2: '',
    message: ''
  });

  constructor(
    private messageService: MessageService,
    private companyService: CompanyService
  ) { }

  async ngOnInit() {
    const data = await this.companyService.getCompanyInfo();
    if (data) {
      this.companyInfo.set(data);
    }
  }

  async saveCompanyInfo() {
    try {
      const response = await this.companyService.saveCompanyInfo(this.companyInfo());
      if (response && response.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Company information saved successfully'
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save company information'
        });
      }
    } catch (error) {
      console.error('Error in saveCompanyInfo:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while saving'
      });
    }
  }
}
