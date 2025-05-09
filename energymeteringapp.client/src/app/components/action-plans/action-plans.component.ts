import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ChartService } from '../../services/chart.service';
import { PlotlyModule } from 'angular-plotly.js';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-action-plans',
  templateUrl: './action-plans.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, PlotlyModule]
})
export class ActionPlansComponent implements OnInit {
  actionPlans: any[] = [];
  classifications: any[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;

  formData = {
    name: '',
    classificationId: '',
    description: '',
    energySavingEstimate: 0,
    costEstimate: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Planned',
    responsible: '',
    notes: ''
  };

  editingPlan: any = null;
  viewingPlan: any = null;

  // Chart data
  chartData: any[] = [];
  chartLayout: any = {};

  statusOptions = [
    { value: 'Planned', label: 'Planned', color: 'bg-secondary' },
    { value: 'InProgress', label: 'In Progress', color: 'bg-primary' },
    { value: 'Completed', label: 'Completed', color: 'bg-success' },
    { value: 'Delayed', label: 'Delayed', color: 'bg-warning' },
    { value: 'Cancelled', label: 'Cancelled', color: 'bg-danger' }
  ];

  constructor(
    private apiService: ApiService,
    private chartService: ChartService
  ) { }

  ngOnInit(): void {
    this.fetchClassifications();
    this.fetchActionPlans();
  }

  fetchClassifications(): void {
    this.apiService.getClassifications().subscribe({
      next: (data) => {
        this.classifications = data || [];
        if (this.classifications.length > 0) {
          this.formData.classificationId = this.classifications[0].id;
        }
      },
      error: (err) => {
        console.error('Error fetching classifications:', err);
        this.error = 'Failed to load classifications. Please try again.';
      }
    });
  }

  fetchActionPlans(): void {
    this.loading = true;
    this.apiService.getActionPlans().subscribe({
      next: (data) => {
        this.actionPlans = data || [];
        this.updateCharts();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching action plans:', err);
        this.error = 'Failed to load action plans. Please try again.';
        this.loading = false;
      }
    });
  }

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.loading = true;

    const payload = {
      ...this.formData,
      classificationId: parseInt(this.formData.classificationId as string)
    };

    if (this.editingPlan) {
      // Update existing plan
      this.apiService.updateActionPlan(this.editingPlan.id, payload).subscribe({
        next: () => {
          this.success = 'Action plan updated successfully!';
          this.fetchActionPlans();
          this.resetForm();
        },
        error: (err) => {
          console.error('Error updating action plan:', err);
          this.error = 'Failed to update action plan. Please try again.';
          this.loading = false;
        }
      });
    } else {
      // Create new plan
      this.apiService.createActionPlan(payload).subscribe({
        next: () => {
          this.success = 'Action plan created successfully!';
          this.fetchActionPlans();
          this.resetForm();
        },
        error: (err) => {
          console.error('Error creating action plan:', err);
          this.error = 'Failed to create action plan. Please try again.';
          this.loading = false;
        }
      });
    }
  }

  editPlan(plan: any): void {
    this.editingPlan = plan;
    this.formData = {
      name: plan.name,
      classificationId: plan.classificationId.toString(),
      description: plan.description || '',
      energySavingEstimate: plan.energySavingEstimate,
      costEstimate: plan.costEstimate,
      startDate: new Date(plan.startDate).toISOString().split('T')[0],
      endDate: new Date(plan.endDate).toISOString().split('T')[0],
      status: plan.status,
      responsible: plan.responsible || '',
      notes: plan.notes || ''
    };
  }

  viewPlan(plan: any): void {
    this.viewingPlan = plan;
  }

  resetForm(): void {
    this.editingPlan = null;
    this.formData = {
      name: '',
      classificationId: this.classifications.length > 0 ? this.classifications[0].id : '',
      description: '',
      energySavingEstimate: 0,
      costEstimate: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Planned',
      responsible: '',
      notes: ''
    };
  }

  handleDelete(id: number): void {
    if (!confirm('Are you sure you want to delete this action plan?')) {
      return;
    }

    this.loading = true;
    this.apiService.deleteActionPlan(id).subscribe({
      next: () => {
        this.success = 'Action plan deleted successfully!';
        this.fetchActionPlans();
        if (this.viewingPlan?.id === id) {
          this.viewingPlan = null;
        }
      },
      error: (err) => {
        console.error('Error deleting action plan:', err);
        this.error = 'Failed to delete action plan. Please try again.';
        this.loading = false;
      }
    });
  }

  // Helper methods to move complex operations out of the template
  getCompletedCount(): number {
    if (!this.actionPlans || this.actionPlans.length === 0) return 0;
    return this.actionPlans.filter(p => p.status === 'Completed').length;
  }

  getInProgressCount(): number {
    if (!this.actionPlans || this.actionPlans.length === 0) return 0;
    return this.actionPlans.filter(p => p.status === 'InProgress').length;
  }

  getTotalSavings(): number {
    if (!this.actionPlans || this.actionPlans.length === 0) return 0;
    return this.actionPlans.reduce((sum, p) => sum + (p.energySavingEstimate || 0), 0);
  }

  getStatusBadge(status: string): string {
    const statusObj = this.statusOptions.find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-secondary';
  }

  getStatusLabel(status: string): string {
    const statusObj = this.statusOptions.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  }

  getClassificationName(id: number): string {
    if (!id || !this.classifications) return 'Unknown';
    const classification = this.classifications.find(c => c && c.id === id);
    return classification && classification.name ? classification.name : 'Unknown';
  }

  // Improve the updateCharts() method in action-plans.component.ts

  updateCharts(): void {
    if (!this.actionPlans || this.actionPlans.length === 0) {
      this.chartData = [];
      return;
    }

    // Status distribution chart
    const statusCounts: { [key: string]: number } = {};
    this.statusOptions.forEach(status => {
      statusCounts[status.value] = 0;
    });

    this.actionPlans.forEach(plan => {
      if (plan && typeof plan.status === 'string') {
        if (statusCounts[plan.status] !== undefined) {
          statusCounts[plan.status]++;
        } else {
          statusCounts[plan.status] = 1;
        }
      }
    });

    // Filter out status with 0 count
    const labels = Object.keys(statusCounts).filter(key => statusCounts[key] > 0);
    const values = labels.map(key => statusCounts[key]);
    const colors = labels.map(key => {
      const statusObj = this.statusOptions.find(s => s.value === key);
      return statusObj ? statusObj.color.replace('bg-', '') : 'secondary';
    });

    // Convert bg-* to plotly colors
    const colorMap: { [key: string]: string } = {
      'primary': 'rgb(13, 110, 253)',
      'secondary': 'rgb(108, 117, 125)',
      'success': 'rgb(25, 135, 84)',
      'danger': 'rgb(220, 53, 69)',
      'warning': 'rgb(255, 193, 7)',
      'info': 'rgb(13, 202, 240)'
    };

    const plotlyColors = colors.map(color => colorMap[color] || colorMap['secondary']);

    // Energy savings by classification chart with null checks
    const savingsByClassification: { [key: string]: number } = {};

    this.actionPlans.forEach(plan => {
      if (plan) {
        const className = this.getClassificationName(plan.classificationId);
        if (className) {
          if (!savingsByClassification[className]) {
            savingsByClassification[className] = 0;
          }
          savingsByClassification[className] += typeof plan.energySavingEstimate === 'number' ?
            plan.energySavingEstimate : 0;
        }
      }
    });

    const classLabels = Object.keys(savingsByClassification);
    const classSavings = classLabels.map(key => savingsByClassification[key]);

    this.chartData = [
      {
        type: 'pie',
        labels: labels.map(key => this.getStatusLabel(key)),
        values: values,
        name: 'Status Distribution',
        domain: { row: 0, column: 0 },
        marker: {
          colors: plotlyColors
        },
        hoverinfo: 'label+percent',
        textinfo: 'value'
      },
      {
        type: 'bar',
        x: classLabels,
        y: classSavings,
        name: 'Energy Savings by Classification',
        domain: { row: 0, column: 1 },
        marker: {
          color: 'rgba(25, 135, 84, 0.7)'
        }
      }
    ];

    this.chartLayout = {
      title: 'Action Plans Overview',
      grid: { rows: 1, columns: 2, pattern: 'independent' },
      height: 400
    };
  }
}
