// energymeteringapp.client/src/app/components/targets-manager/targets-manager.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlotlyModule } from 'angular-plotly.js';
import { ApiService } from '../../services/api.service';
import { ChartService } from '../../services/chart.service';

@Component({
  selector: 'app-targets-manager',
  templateUrl: './targets-manager.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, PlotlyModule]
})
export class TargetsManagerComponent implements OnInit {
  enpiDefinitions: any[] = [];
  targets: any[] = [];
  enpiList: any[] = [];
  classifications: any[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;

  formData = {
    enpiDefinitionId: '',
    targetValue: 5,
    targetType: 'Reduction', // Reduction, AbsoluteValue, MaximumValue
    targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Annual reduction target'
  };

  enpiDefFormData = {
    name: '',
    classificationId: '',
    formulaType: 'TotalEnergy',
    normalizeBy: 'None',
    normalizationUnit: '',
    description: ''
  };

  targetChartData: any[] = [];
  targetChartLayout: any = {};

  constructor(
    private apiService: ApiService,
    private chartService: ChartService
  ) { }

  ngOnInit(): void {
    this.fetchClassifications();
    this.fetchEnPIDefinitions();
    this.fetchTargets();
    this.fetchEnPIs();
  }

  fetchClassifications(): void {
    this.apiService.getClassifications().subscribe({
      next: (data) => {
        this.classifications = data;
        if (data.length > 0) {
          this.enpiDefFormData.classificationId = data[0].id;
        }
      },
      error: (err) => {
        console.error('Error fetching classifications:', err);
        this.error = 'Failed to load classifications. Please try again.';
      }
    });
  }

  fetchEnPIDefinitions(): void {
    this.loading = true;
    this.apiService.getEnPIDefinitions().subscribe({
      next: (data) => {
        this.enpiDefinitions = data;
        if (data.length > 0) {
          this.formData.enpiDefinitionId = data[0].id;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching EnPI definitions:', err);
        this.error = 'Failed to load EnPI definitions. Please try again.';
        this.loading = false;
      }
    });
  }

  fetchTargets(): void {
    this.loading = true;
    this.apiService.getTargets().subscribe({
      next: (data) => {
        this.targets = data;
        this.updateTargetChart();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching targets:', err);
        this.error = 'Failed to load targets. Please try again.';
        this.loading = false;
      }
    });
  }

  fetchEnPIs(): void {
    this.apiService.getEnPIs().subscribe({
      next: (data) => {
        this.enpiList = data;
      },
      error: (err) => {
        console.error('Error fetching EnPIs:', err);
      }
    });
  }

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.loading = true;

    const payload = {
      enpiDefinitionId: parseInt(this.formData.enpiDefinitionId as string),
      targetValue: this.formData.targetValue,
      targetType: this.formData.targetType,
      targetDate: new Date(this.formData.targetDate),
      description: this.formData.description
    };

    this.apiService.createTarget(payload).subscribe({
      next: (data) => {
        this.success = 'Target created successfully!';
        this.fetchTargets();
        this.formData.description = 'Annual reduction target';
      },
      error: (err) => {
        console.error('Error creating target:', err);
        this.error = 'Failed to create target. Please try again.';
        this.loading = false;
      }
    });
  }

  handleEnPIDefSubmit(event: Event): void {
    event.preventDefault();
    this.loading = true;

    const payload = {
      name: this.enpiDefFormData.name,
      classificationId: parseInt(this.enpiDefFormData.classificationId as string),
      formulaType: this.enpiDefFormData.formulaType,
      normalizeBy: this.enpiDefFormData.normalizeBy,
      normalizationUnit: this.enpiDefFormData.normalizationUnit,
      description: this.enpiDefFormData.description
    };

    this.apiService.createEnPIDefinition(payload).subscribe({
      next: (data) => {
        this.success = 'EnPI Definition created successfully!';
        this.fetchEnPIDefinitions();
        this.enpiDefFormData.name = '';
        this.enpiDefFormData.description = '';
      },
      error: (err) => {
        console.error('Error creating EnPI definition:', err);
        this.error = 'Failed to create EnPI definition. Please try again.';
        this.loading = false;
      }
    });
  }

  handleDelete(id: number): void {
    this.loading = true;
    this.apiService.deleteTarget(id).subscribe({
      next: () => {
        this.success = 'Target deleted successfully!';
        this.fetchTargets();
      },
      error: (err) => {
        console.error('Error deleting target:', err);
        this.error = 'Failed to delete target. Please try again.';
        this.loading = false;
      }
    });
  }

  handleEnPIDefDelete(id: number): void {
    this.loading = true;
    this.apiService.deleteEnPIDefinition(id).subscribe({
      next: () => {
        this.success = 'EnPI Definition deleted successfully!';
        this.fetchEnPIDefinitions();
      },
      error: (err) => {
        console.error('Error deleting EnPI definition:', err);
        this.error = 'Failed to delete EnPI definition. It may have targets associated with it.';
        this.loading = false;
      }
    });
  }

  updateTargetChart(): void {
    if (this.targets.length === 0) {
      this.targetChartData = [];
      return;
    }

    // Group targets by EnPI definition
    const targetsByEnPI = new Map<number, any[]>();

    this.targets.forEach(target => {
      if (!targetsByEnPI.has(target.enpiDefinitionId)) {
        targetsByEnPI.set(target.enpiDefinitionId, []);
      }
      targetsByEnPI.get(target.enpiDefinitionId)!.push(target);
    });

    // Create chart data
    this.targetChartData = [];

    targetsByEnPI.forEach((targets, enpiId) => {
      const enpiDef = this.enpiDefinitions.find(def => def.id === enpiId);
      if (!enpiDef) return;

      // Sort targets by date
      const sortedTargets = [...targets].sort((a, b) =>
        new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
      );

      // Find current EnPI value if available
      const currentEnPI = this.enpiList.find(enpi =>
        enpi.classificationId === enpiDef.classificationId &&
        enpi.formula === enpiDef.formulaType
      );

      const currentValue = currentEnPI ? currentEnPI.currentValue : null;

      // Add line for this EnPI
      this.targetChartData.push({
        x: sortedTargets.map(t => new Date(t.targetDate)),
        y: sortedTargets.map(t => {
          if (t.targetType === 'AbsoluteValue') {
            return t.targetValue;
          } else if (t.targetType === 'Reduction' && currentValue) {
            return currentValue * (1 - t.targetValue / 100);
          } else {
            return t.targetValue;
          }
        }),
        type: 'scatter',
        mode: 'lines+markers',
        name: enpiDef.name,
        marker: { size: 8 }
      });

      // Add current value point if available
      if (currentValue !== null) {
        this.targetChartData.push({
          x: [new Date()],
          y: [currentValue],
          type: 'scatter',
          mode: 'markers',
          name: `${enpiDef.name} (Current)`,
          marker: {
            size: 12,
            symbol: 'star'
          }
        });
      }
    });

    // Create chart layout
    this.targetChartLayout = {
      title: 'Energy Performance Targets',
      xaxis: {
        title: 'Target Date',
        type: 'date'
      },
      yaxis: {
        title: 'Value'
      },
      height: 500,
      legend: {
        orientation: 'h',
        y: -0.2
      }
    };
  }

  getEnPIDefName(id: number): string {
    const def = this.enpiDefinitions.find(d => d.id === id);
    return def ? def.name : 'Unknown';
  }
}
