// targets-manager.component.ts
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
        this.classifications = data || [];
        if (this.classifications && this.classifications.length > 0) {
          this.enpiDefFormData.classificationId = this.classifications[0].id.toString();
        }
      },
      error: (err) => {
        console.error('Error fetching classifications:', err);
        this.error = 'Failed to load classifications. Please try again.';
      }
    });
  }

  fetchEnPIDefinitions(): void {
    console.log('About to fetch EnPI definitions');
    this.loading = true;
    this.apiService.getEnPIDefinitions().subscribe({
      next: (data) => {
        console.log('EnPI definitions received:', data); // Add logging
        this.enpiDefinitions = Array.isArray(data) ? data : [];

        // Make sure to set default value if available
        if (this.enpiDefinitions && this.enpiDefinitions.length > 0) {
          this.formData.enpiDefinitionId = this.enpiDefinitions[0].id.toString();
        } else {
          console.warn('No EnPI definitions available');
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching EnPI definitions:', err);
        this.error = 'Failed to load EnPI definitions. Please try again.';
        this.enpiDefinitions = []; // Initialize to empty array on error
        this.loading = false;
      }
    });
  }

  fetchTargets(): void {
    this.loading = true;
    this.apiService.getTargets().subscribe({
      next: (data) => {
        this.targets = data || [];
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
        this.enpiList = data || [];
        // Update chart with fresh EnPI data
        this.updateTargetChart();
      },
      error: (err) => {
        console.error('Error fetching EnPIs:', err);
        // Don't show error here since this is supplementary data
      }
    });
  }

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.loading = true;
    this.error = null;
    this.success = null;

    // Validate required fields
    if (!this.formData.enpiDefinitionId) {
      this.error = 'Please select an EnPI definition';
      this.loading = false;
      return;
    }

    if (this.formData.targetValue <= 0) {
      this.error = 'Target value must be greater than zero';
      this.loading = false;
      return;
    }

    const payload = {
      enpiDefinitionId: parseInt(this.formData.enpiDefinitionId),
      targetValue: this.formData.targetValue,
      targetType: this.formData.targetType || 'Reduction',
      targetDate: new Date(this.formData.targetDate).toISOString(),
      description: this.formData.description || 'Annual reduction target'
    };

    this.apiService.createTarget(payload).subscribe({
      next: () => {
        this.success = 'Target created successfully!';
        this.fetchTargets(); // Refresh the targets list
        this.formData.description = 'Annual reduction target'; // Reset just the description
      },
      error: (err) => {
        console.error('Error creating target:', err);
        this.error = err.error?.message || 'Failed to create target. Please try again.';
        this.loading = false;
      }
    });
  }

  handleEnPIDefSubmit(event: Event): void {
    event.preventDefault();
    this.loading = true;
    this.error = null;
    this.success = null;

    // Validate required fields
    if (!this.enpiDefFormData.name) {
      this.error = 'Name is required';
      this.loading = false;
      return;
    }

    if (!this.enpiDefFormData.classificationId) {
      this.error = 'Classification is required';
      this.loading = false;
      return;
    }

    // Require normalization unit if normalize by is not None
    if (this.enpiDefFormData.normalizeBy !== 'None' && !this.enpiDefFormData.normalizationUnit) {
      this.error = 'Normalization unit is required when normalization is selected';
      this.loading = false;
      return;
    }

    const payload = {
      name: this.enpiDefFormData.name,
      classificationId: parseInt(this.enpiDefFormData.classificationId),
      formulaType: this.enpiDefFormData.formulaType || 'TotalEnergy',
      normalizeBy: this.enpiDefFormData.normalizeBy || 'None',
      normalizationUnit: this.enpiDefFormData.normalizationUnit,
      description: this.enpiDefFormData.description
    };

    this.apiService.createEnPIDefinition(payload).subscribe({
      next: (data) => {
        this.success = 'EnPI Definition created successfully!';
        this.fetchEnPIDefinitions(); // Refresh the list

        // Reset form fields
        this.enpiDefFormData.name = '';
        this.enpiDefFormData.description = '';
        this.enpiDefFormData.normalizationUnit = '';
        // Keep the selected classification to make it easier to create multiple definitions
      },
      error: (err) => {
        console.error('Error creating EnPI definition:', err);
        this.error = err.error?.message || 'Failed to create EnPI definition. Please try again.';
        this.loading = false;
      }
    });
  }

  handleDelete(id: number): void {
    if (!id) {
      this.error = 'Invalid target ID';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    this.apiService.deleteTarget(id).subscribe({
      next: () => {
        this.success = 'Target deleted successfully!';
        this.fetchTargets(); // Refresh the targets list
      },
      error: (err) => {
        console.error('Error deleting target:', err);
        this.error = err.error?.message || 'Failed to delete target. Please try again.';
        this.loading = false;
      }
    });
  }

  handleEnPIDefDelete(id: number): void {
    if (!id) {
      this.error = 'Invalid EnPI definition ID';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    this.apiService.deleteEnPIDefinition(id).subscribe({
      next: () => {
        this.success = 'EnPI Definition deleted successfully!';
        this.fetchEnPIDefinitions(); // Refresh the list
      },
      error: (err) => {
        console.error('Error deleting EnPI definition:', err);
        this.error = err.error?.message || 'Failed to delete EnPI definition. It may have targets associated with it.';
        this.loading = false;
      }
    });
  }

  // Improve updateTargetChart method in targets-manager.component.ts

  updateTargetChart(): void {
    if (!this.targets || this.targets.length === 0) {
      this.targetChartData = [];
      return;
    }

    // Group targets by EnPI definition with null safety
    const targetsByEnPI = new Map<number, any[]>();

    this.targets.forEach(target => {
      if (target && typeof target.enpiDefinitionId === 'number') {
        if (!targetsByEnPI.has(target.enpiDefinitionId)) {
          targetsByEnPI.set(target.enpiDefinitionId, []);
        }

        const targetsForEnPI = targetsByEnPI.get(target.enpiDefinitionId);
        if (targetsForEnPI) {
          targetsForEnPI.push(target);
        }
      }
    });

    // Create chart data
    this.targetChartData = [];

    targetsByEnPI.forEach((targets, enpiId) => {
      const enpiDef = this.enpiDefinitions.find(def => def && def.id === enpiId);
      if (!enpiDef) return;

      // Sort targets by date with null safety
      const sortedTargets = [...targets]
        .filter(t => t && t.targetDate)
        .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

      if (sortedTargets.length === 0) return;

      // Find current EnPI value if available
      const currentEnPI = this.enpiList.find(enpi =>
        enpi &&
        typeof enpi.classificationId === 'number' &&
        enpi.classificationId === enpiDef.classificationId &&
        typeof enpi.formula === 'string' &&
        enpi.formula === enpiDef.formulaType
      );

      const currentValue = currentEnPI && typeof currentEnPI.currentValue === 'number' ?
        currentEnPI.currentValue : null;

      // Add line for this EnPI
      this.targetChartData.push({
        x: sortedTargets.map(t => new Date(t.targetDate)),
        y: sortedTargets.map(t => {
          if (!t) return 0;

          if (t.targetType === 'AbsoluteValue' && typeof t.targetValue === 'number') {
            return t.targetValue;
          } else if (t.targetType === 'Reduction' &&
            typeof t.targetValue === 'number' &&
            currentValue !== null) {
            return currentValue * (1 - t.targetValue / 100);
          } else {
            return typeof t.targetValue === 'number' ? t.targetValue : 0;
          }
        }),
        type: 'scatter',
        mode: 'lines+markers',
        name: enpiDef.name || `EnPI ${enpiDef.id}`,
        marker: { size: 8 }
      });

      // Add current value point if available
      if (currentValue !== null) {
        this.targetChartData.push({
          x: [new Date()],
          y: [currentValue],
          type: 'scatter',
          mode: 'markers',
          name: `${enpiDef.name || `EnPI ${enpiDef.id}`} (Current)`,
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
    if (!id || !this.enpiDefinitions) return 'Unknown';

    const def = this.enpiDefinitions.find(d => d && d.id === id);
    return def ? (def.name || `Definition ${id}`) : `Unknown (${id})`;
  }
}
