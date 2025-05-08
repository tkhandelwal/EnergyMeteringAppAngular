// equipment.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Equipment {
  id?: number;
  name: string;
  description?: string;
  location?: string;
  installDate: string;
  status: string;
  classifications?: any[];
}

@Component({
  selector: 'app-equipment',
  templateUrl: './equipment.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class EquipmentComponent implements OnInit {
  equipment: Equipment[] = [];
  classifications: any[] = [];
  enpiDefinitions: any[] = [];
  equipmentTargets: any[] = [];
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

  // Target form data
  targetForm = {
    enpiDefinitionId: '',
    targetValue: 5,
    targetType: 'Reduction',
    targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Equipment reduction target'
  };

  // Data generation form
  dataGenerationForm = {
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    intervalMinutes: 15,
    baseValue: 10,
    variance: 2
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
    this.fetchEnPIDefinitions();
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

  fetchEnPIDefinitions(): void {
    this.apiService.getEnPIDefinitions().subscribe({
      next: (data) => {
        this.enpiDefinitions = data;
        if (data.length > 0) {
          this.targetForm.enpiDefinitionId = data[0].id;
        }
      },
      error: (err) => {
        console.error('Error fetching EnPI definitions:', err);
      }
    });
  }

  validateForm(): boolean {
    if (!this.formData.name.trim()) {
      this.error = 'Equipment name is required';
      return false;
    }
    return true;
  }

  handleSubmit(event: Event): void {
    event.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = null;

    // Only include the basic equipment properties
    const payload = {
      name: this.formData.name,
      description: this.formData.description,
      location: this.formData.location,
      installDate: this.formData.installDate,
      status: this.formData.status
    };

    console.log('Creating equipment with payload:', payload);

    this.apiService.createEquipment(payload).subscribe({
      next: () => {
        this.success = 'Equipment created successfully!';
        this.fetchEquipment();
        this.resetForm();
      },
      error: (err) => {
        console.error('Error creating equipment:', err);
        this.error = `Failed to create equipment: ${err.message || 'Please try again'}`;
        this.loading = false;
      }
    });
  }

  viewEquipment(equipment: any): void {
    this.selectedEquipment = equipment;

    // Fetch targets for this equipment
    this.fetchEquipmentTargets(equipment.id);
  }

  fetchEquipmentTargets(equipmentId: number): void {
    this.apiService.getEquipmentTargets(equipmentId).subscribe({
      next: (data) => {
        this.equipmentTargets = data;
      },
      error: (err) => {
        console.error('Error fetching equipment targets:', err);
        this.error = 'Failed to load equipment targets.';
      }
    });
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
        this.error = `Failed to add classification: ${err.message || 'Please try again'}`;
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
        this.error = `Failed to remove classification: ${err.message || 'Please try again'}`;
        this.loading = false;
      }
    });
  }

  isClassificationAssigned(classificationId: number): boolean {
    if (!this.selectedEquipment || !this.selectedEquipment.classifications) return false;
    return this.selectedEquipment.classifications.some((c: any) => c.id === classificationId);
  }

  // Handle target form submission
  handleTargetSubmit(): void {
    if (!this.selectedEquipment) {
      this.error = 'Please select an equipment first';
      return;
    }

    this.loading = true;
    this.error = null;

    const payload = {
      enpiDefinitionId: parseInt(this.targetForm.enpiDefinitionId as string),
      equipmentId: this.selectedEquipment.id,
      targetValue: this.targetForm.targetValue,
      targetType: this.targetForm.targetType,
      targetDate: new Date(this.targetForm.targetDate),
      description: this.targetForm.description
    };

    this.apiService.createEquipmentTarget(payload).subscribe({
      next: (data) => {
        this.success = 'Target created successfully!';
        this.fetchEquipmentTargets(this.selectedEquipment.id);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error creating target:', err);
        this.error = 'Failed to create target. Please try again.';
        this.loading = false;
      }
    });
  }

  // Handle target deletion
  handleTargetDelete(id: number): void {
    this.loading = true;
    this.apiService.deleteTarget(id).subscribe({
      next: () => {
        this.success = 'Target deleted successfully!';
        if (this.selectedEquipment) {
          this.fetchEquipmentTargets(this.selectedEquipment.id);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error deleting target:', err);
        this.error = 'Failed to delete target. Please try again.';
        this.loading = false;
      }
    });
  }

  // Get EnPI definition name
  getEnPIDefName(id: number): string {
    const def = this.enpiDefinitions.find(d => d.id === id);
    return def ? def.name : 'Unknown';
  }

  // Handle synthetic data generation
  handleGenerateData(): void {
    if (!this.selectedEquipment) {
      this.error = 'Please select an equipment first';
      return;
    }

    this.loading = true;
    this.error = null;

    // For each classification associated with the equipment, generate data
    if (!this.selectedEquipment.classifications || this.selectedEquipment.classifications.length === 0) {
      this.error = 'Equipment must have at least one classification to generate data';
      this.loading = false;
      return;
    }

    // Construct parameters
    const params = {
      equipmentId: this.selectedEquipment.id,
      startDate: this.dataGenerationForm.startDate,
      endDate: this.dataGenerationForm.endDate,
      intervalMinutes: this.dataGenerationForm.intervalMinutes,
      baseValue: this.dataGenerationForm.baseValue,
      variance: this.dataGenerationForm.variance
    };

    this.apiService.generateEquipmentData(params).subscribe({
      next: () => {
        this.success = `Data generated successfully for ${this.selectedEquipment.name}`;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error generating data:', err);
        this.error = `Failed to generate data: ${err.message || 'Unknown error'}`;
        this.loading = false;
      }
    });
  }
}
