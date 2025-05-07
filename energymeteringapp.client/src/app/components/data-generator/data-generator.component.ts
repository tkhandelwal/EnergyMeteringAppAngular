import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-data-generator',
    templateUrl: './data-generator.component.html',
    styleUrls: ['./data-generator.component.css']
})
export class DataGeneratorComponent implements OnInit {
    classifications: any[] = [];
    formData = {
        classificationId: '', // This should start as a string, not a number
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        intervalMinutes: 15,
        baseValue: 10,
        variance: 2
    };
  alert = { show: false, message: '', variant: '' };
  loading = false;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.fetchClassifications();
  }

  fetchClassifications(): void {
    this.loading = true;
    this.apiService.getClassifications().subscribe({
      next: (data) => {
        this.classifications = data;
        if (data.length > 0 && !this.formData.classificationId) {
          this.formData.classificationId = data[0].id;
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

  handleChange(event: any): void {
    const { name, value, type } = event.target;
    const parsedValue = type === 'number' ? parseFloat(value) : value;

    this.formData = {
      ...this.formData,
      [name]: parsedValue
    } as any;
  }

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.loading = true;

    const payload = {
      ...this.formData,
      classificationId: parseInt(this.formData.classificationId as string)
    };

    this.apiService.generateData(payload).subscribe({
      next: () => {
        this.showAlert('Synthetic data generated successfully!', 'success');
      },
      error: (error) => {
        console.error('Error generating data:', error);
        this.showAlert(`Error: ${error.message || 'Failed to generate data'}`, 'danger');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  showAlert(message: string, variant: string): void {
    this.alert = {
      show: true,
      message,
      variant
    };

    setTimeout(() => {
      this.alert = { show: false, message: '', variant: '' };
    }, 3000);
  }
}
