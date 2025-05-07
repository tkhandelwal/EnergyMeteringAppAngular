import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-equipment',
  templateUrl: './equipment.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class EquipmentComponent implements OnInit {
  equipment: any[] = [];
  classifications: any[] = [];
  selectedEquipment: any = null;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  formData = {
    name: '',
    description: '',
    location: '',
    installDate: new Date().toISOString().split('T')[0],
    status: 'Active'
  };

  statusOptions = [
    { value: 'Active', label: 'Active', color: 'bg-success' },
    { value: 'Inactive', label: 'Inactive', color: 'bg-secondary' },
    { value: 'Maintenance', label: 'Under Maintenance', color: 'bg-warning' },
    { value: 'Decommissioned', label: 'Decommissioned', color: 'bg-danger' }
  ];

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.fetchEquipment();
    this.fetchClassifications();
  }

  fetchEquipment(): void {
    this.loading = true;
    this.apiService.getEquipment().subscribe({
      next: (data) => {
        this.equipment = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching equipment:', err);
        this.error = 'Failed to load equipment. Please try again.';
        this.loading = false;
      }
    });
  }

  fetchClassifications(): void {
    this.apiService.getClassifications().subscribe({
      next: (data) => {
        this.classifications = data;
      },
      error: (err) => {
        console.error('Error fetching classifications:', err);
      }
    });
  }

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.loading = true;

    const payload = {
      ...this.formData
    };

    this.apiService.createEquipment(payload).subscribe({
      next: () => {
        this.success = 'Equipment created successfully!';
        this.fetchEquipment();
        this.resetForm();
      },
      error: (err) => {
        console.error('Error creating equipment:', err);
        this.error = 'Failed to create equipment. Please try again.';
        this.loading = false;
      }
    });
  }

  viewEquipment(equipment: any): void {
    this.selectedEquipment = equipment;
  }

  resetForm(): void {
    this.formData = {
      name: '',
      description: '',
      location: '',
      installDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    };
    this.loading = false;
  }

  handleDelete(id: number): void {
    if (!confirm('Are you sure you want to delete this equipment?')) {
      return;
    }

    this.loading = true;
    this.apiService.deleteEquipment(id).subscribe({
      next: () => {
        this.success = 'Equipment deleted successfully!';
        this.fetchEquipment();
        if (this.selectedEquipment?.id === id) {
          this.selectedEquipment = null;
        }
      },
      error: (err) => {
        console.error('Error deleting equipment:', err);
        this.error = 'Failed to delete equipment. Please try again.';
        this.loading = false;
      }
    });
  }

  getStatusLabel(status: string): string {
    const statusObj = this.statusOptions.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  }

  getStatusBadge(status: string): string {
    const statusObj = this.statusOptions.find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-secondary';
  }

  addClassificationToEquipment(equipmentId: number, classificationId: string): void {
    if (!classificationId) return;

    this.loading = true;
    this.apiService.addClassificationToEquipment(equipmentId, parseInt(classificationId)).subscribe({
      next: () => {
        this.success = 'Classification added successfully!';
        this.fetchEquipment();
      },
      error: (err) => {
        console.error('Error adding classification:', err);
        this.error = 'Failed to add classification. Please try again.';
        this.loading = false;
      }
    });
  }

  removeClassificationFromEquipment(equipmentId: number, classificationId: number): void {
    this.loading = true;
    this.apiService.removeClassificationFromEquipment(equipmentId, classificationId).subscribe({
      next: () => {
        this.success = 'Classification removed successfully!';
        this.fetchEquipment();
      },
      error: (err) => {
        console.error('Error removing classification:', err);
        this.error = 'Failed to remove classification. Please try again.';
        this.loading = false;
      }
    });
  }

  isClassificationAssigned(classificationId: number): boolean {
    if (!this.selectedEquipment || !this.selectedEquipment.classifications) return false;
    return this.selectedEquipment.classifications.some((c: any) => c.id === classificationId);
  }
}
