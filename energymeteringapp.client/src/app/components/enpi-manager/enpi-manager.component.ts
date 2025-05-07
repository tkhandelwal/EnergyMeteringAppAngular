// src/app/components/enpi-manager/enpi-manager.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-enpi-manager',
  templateUrl: './enpi-manager.component.html',
  styleUrls: ['./enpi-manager.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class EnPIManagerComponent implements OnInit {
  classifications: any[] = [];
  enpiList: any[] = [];
  alert = { show: false, message: '', variant: '' };
  loading = false;
  formData = {
    name: '',
    formula: 'EnergyPerHour',
    classificationId: '',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    baselineStartDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    baselineEndDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    useBaseline: true
  };

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.fetchClassifications();
    this.fetchEnPIs();
  }

  fetchClassifications(): void {
    this.loading = true;
    this.apiService.getClassifications().subscribe({
      next: (response) => {
        this.classifications = response;
        if (response.length > 0) {
          this.formData.classificationId = response[0].id;
        }
      },
      error: (error) => {
        console.error('Error fetching classifications:', error);
        this.showAlert('Failed to load classifications', 'danger');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  fetchEnPIs(): void {
    this.loading = true;
    this.apiService.getEnPIs().subscribe({
      next: (response) => {
        this.enpiList = response;
      },
      error: (error) => {
        console.error('Error fetching EnPIs:', error);
        this.showAlert('Failed to load EnPIs', 'danger');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  handleChange(event: any): void {
    const { name, value, type, checked } = event.target;
    this.formData = {
      ...this.formData,
      [name]: type === 'checkbox' ? checked : value
    } as any;
  }

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.loading = true;

    // Prepare payload
    const payload = {
      name: this.formData.name,
      formula: this.formData.formula,
      classificationId: parseInt(this.formData.classificationId as string),
      startDate: new Date(this.formData.startDate),
      endDate: new Date(this.formData.endDate),
      baselineStartDate: this.formData.useBaseline ? new Date(this.formData.baselineStartDate) : null,
      baselineEndDate: this.formData.useBaseline ? new Date(this.formData.baselineEndDate) : null
    };

    this.apiService.calculateEnPI(payload).subscribe({
      next: () => {
        this.showAlert('EnPI calculated successfully!', 'success');
        this.fetchEnPIs();

        // Reset form
        this.formData = {
          ...this.formData,
          name: ''
        };
      },
      error: (error) => {
        console.error('Error calculating EnPI:', error);
        this.showAlert(`Failed to calculate EnPI: ${error.message || 'Unknown error'}`, 'danger');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  handleDelete(id: number): void {
    this.loading = true;
    this.apiService.deleteEnPI(id).subscribe({
      next: () => {
        this.showAlert('EnPI deleted successfully', 'success');
        this.fetchEnPIs();
      },
      error: (error) => {
        console.error('Error deleting EnPI:', error);
        this.showAlert('Failed to delete EnPI', 'danger');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  showAlert(message: string, variant: string): void {
    this.alert = { show: true, message, variant };
    setTimeout(() => {
      this.alert = { show: false, message: '', variant: '' };
    }, 3000);
  }

  getClassificationName(id: number): string {
    const classification = this.classifications.find(c => c.id === id);
    return classification ? classification.name : 'Unknown';
  }
}
