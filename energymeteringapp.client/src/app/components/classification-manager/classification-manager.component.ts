import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-classification-manager',
  templateUrl: './classification-manager.component.html',
  styleUrls: ['./classification-manager.component.css']
})
export class ClassificationManagerComponent implements OnInit {
  classifications: any[] = [];
  formData = {
    name: '',
    type: 'Equipment',
    energyType: 'Electricity',
    measurementUnit: 'kWh'
  };
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.fetchClassifications();
  }

  fetchClassifications(): void {
    this.loading = true;
    this.apiService.getClassifications().subscribe({
      next: (data) => {
        this.classifications = data;
        this.error = null;
      },
      error: (err) => {
        console.error('Error fetching classifications:', err);
        this.error = 'Failed to load classifications. Please try again.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  handleSubmit(): void {
    this.loading = true;
    this.apiService.createClassification(this.formData).subscribe({
      next: () => {
        this.formData = {
          name: '',
          type: 'Equipment',
          energyType: 'Electricity',
          measurementUnit: 'kWh'
        };
        this.fetchClassifications();
        this.success = 'Classification created successfully!';
        setTimeout(() => this.success = null, 3000);
      },
      error: (err) => {
        console.error('Error creating classification:', err);
        this.error = 'Failed to create classification. Please try again.';
        setTimeout(() => this.error = null, 5000);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  handleDelete(id: number): void {
    this.loading = true;
    this.apiService.deleteClassification(id).subscribe({
      next: () => {
        this.fetchClassifications();
        this.success = 'Classification deleted successfully!';
        setTimeout(() => this.success = null, 3000);
      },
      error: (err) => {
        console.error('Error deleting classification:', err);
        this.error = 'Failed to delete classification. It may be referenced by metering data or EnPIs.';
        setTimeout(() => this.error = null, 5000);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  createDefaultClassifications(): void {
    this.loading = true;
    // Create multiple default classifications
    const defaults = [
      { name: "Main Building", type: "Facility", energyType: "Electricity", measurementUnit: "kWh" },
      { name: "Server Room", type: "Equipment", energyType: "Electricity", measurementUnit: "kWh" },
      { name: "Production Line A", type: "ProductionLine", energyType: "Electricity", measurementUnit: "kWh" },
      { name: "Office Space", type: "Facility", energyType: "Electricity", measurementUnit: "kWh" },
      { name: "Data Center", type: "Facility", energyType: "Electricity", measurementUnit: "kWh" },
      { name: "HVAC System", type: "Equipment", energyType: "Electricity", measurementUnit: "kWh" }
    ];

    // Create each one sequentially
    const createNext = (index = 0) => {
      if (index >= defaults.length) {
        this.fetchClassifications();
        this.success = 'Default classifications created successfully!';
        setTimeout(() => this.success = null, 3000);
        this.loading = false;
        return;
      }

      this.apiService.createClassification(defaults[index]).subscribe({
        next: () => createNext(index + 1),
        error: (err) => {
          console.error('Error creating default classifications:', err);
          this.error = 'Failed to create default classifications. Please try again.';
          setTimeout(() => this.error = null, 5000);
          this.loading = false;
        }
      });
    };

    createNext();
  }
}
