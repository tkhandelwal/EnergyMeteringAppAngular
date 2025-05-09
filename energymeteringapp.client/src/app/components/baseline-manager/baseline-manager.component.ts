// baseline-manager.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlotlyModule } from 'angular-plotly.js';
import { ApiService } from '../../services/api.service';
import { ChartService } from '../../services/chart.service';

@Component({
  selector: 'app-baseline-manager',
  templateUrl: './baseline-manager.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, PlotlyModule]
})
export class BaselineManagerComponent implements OnInit {
  classifications: any[] = [];
  baselines: any[] = [];
  meteringData: any[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;
  Math = Math;

  formData = {
    classificationId: '',
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Annual baseline'
  };

  baselineChartData: any[] = [];
  baselineChartLayout: any = {};
  selectedBaseline: any = null;

  constructor(
    private apiService: ApiService,
    private chartService: ChartService
  ) { }

  ngOnInit(): void {
    this.fetchClassifications();
    this.fetchBaselines();
  }

  fetchClassifications(): void {
    this.loading = true;
    this.apiService.getClassifications().subscribe({
      next: (data) => {
        this.classifications = data || [];
        if (this.classifications.length > 0) {
          this.formData.classificationId = this.classifications[0].id.toString();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching classifications:', err);
        this.error = 'Failed to load classifications. Please try again.';
        this.loading = false;
      }
    });
  }

  fetchBaselines(): void {
    this.loading = true;
    this.apiService.getBaselines().subscribe({
      next: (data) => {
        this.baselines = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching baselines:', err);
        this.error = 'Failed to load baselines. Please try again.';
        this.loading = false;
      }
    });
  }

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.loading = true;
    this.error = null;
    this.success = null;

    if (!this.formData.classificationId) {
      this.error = 'Please select a classification';
      this.loading = false;
      return;
    }

    // Validate dates
    if (new Date(this.formData.startDate) >= new Date(this.formData.endDate)) {
      this.error = 'Start date must be before end date';
      this.loading = false;
      return;
    }

    const payload = {
      classificationId: parseInt(this.formData.classificationId),
      startDate: new Date(this.formData.startDate).toISOString(),
      endDate: new Date(this.formData.endDate).toISOString(),
      description: this.formData.description || 'Annual baseline'
    };

    this.apiService.createBaseline(payload).subscribe({
      next: () => {
        this.success = 'Baseline created successfully!';
        this.fetchBaselines();
        this.formData.description = 'Annual baseline';
      },
      error: (err) => {
        console.error('Error creating baseline:', err);
        this.error = err.error?.message || 'Failed to create baseline. Please try again.';
        this.loading = false;
      }
    });
  }

  handleDelete(id: number): void {
    if (!id) {
      this.error = 'Invalid baseline ID';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    this.apiService.deleteBaseline(id).subscribe({
      next: () => {
        this.success = 'Baseline deleted successfully!';
        this.fetchBaselines();
        if (this.selectedBaseline?.id === id) {
          this.selectedBaseline = null;
          this.meteringData = [];
          this.baselineChartData = [];
        }
      },
      error: (err) => {
        console.error('Error deleting baseline:', err);
        this.error = err.error?.message || 'Failed to delete baseline. Please try again.';
        this.loading = false;
      }
    });
  }

  showBaselineData(baseline: any): void {
    if (!baseline) return;

    this.selectedBaseline = baseline;
    this.loading = true;
    this.error = null;

    // Get metering data for the baseline period
    const params = {
      startDate: new Date(baseline.startDate).toISOString(),
      endDate: new Date(baseline.endDate).toISOString(),
      classificationId: baseline.classificationId
    };

    this.apiService.getMeteringData(params).subscribe({
      next: (data) => {
        this.meteringData = data || [];
        this.updateBaselineChart();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching baseline data:', err);
        this.error = err.error?.message || 'Failed to load baseline data. Please try again.';
        this.meteringData = [];
        this.baselineChartData = [];
        this.loading = false;
      }
    });
  }

  updateBaselineChart(): void {
    if (!this.selectedBaseline || !this.meteringData || this.meteringData.length === 0) {
      this.baselineChartData = [];
      return;
    }

    // Group data by date
    const dataByDate = new Map<string, { energy: number, power: number, count: number }>();

    this.meteringData.forEach(item => {
      if (!item) return;

      const date = new Date(item.timestamp).toISOString().split('T')[0];
      if (!dataByDate.has(date)) {
        dataByDate.set(date, { energy: 0, power: 0, count: 0 });
      }

      const current = dataByDate.get(date)!;
      current.energy += (item.energyValue || 0);
      current.power += (item.power || 0);
      current.count++;
    });

    // Convert to arrays for chart
    const dates: string[] = [];
    const energyValues: number[] = [];
    const powerValues: number[] = [];

    dataByDate.forEach((value, key) => {
      dates.push(key);
      energyValues.push(value.energy);
      powerValues.push(value.count > 0 ? value.power / value.count : 0);
    });

    // Sort by date
    const sortedIndices = dates
      .map((date, index) => ({ date, index }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => item.index);

    const sortedDates = sortedIndices.map(i => dates[i]);
    const sortedEnergy = sortedIndices.map(i => energyValues[i]);
    const sortedPower = sortedIndices.map(i => powerValues[i]);

    // Create chart data
    this.baselineChartData = [
      {
        x: sortedDates,
        y: sortedEnergy,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Energy (kWh)',
        marker: { color: 'rgba(55, 128, 191, 0.7)' }
      },
      {
        x: sortedDates,
        y: sortedPower,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Avg Power (kW)',
        yaxis: 'y2',
        marker: { color: 'rgba(219, 64, 82, 0.7)' }
      }
    ];

    // Create chart layout
    this.baselineChartLayout = {
      title: `Baseline Data for ${this.getClassificationName(this.selectedBaseline.classificationId)}`,
      xaxis: {
        title: 'Date',
        tickangle: -45
      },
      yaxis: {
        title: 'Energy (kWh)',
        rangemode: 'tozero'
      },
      yaxis2: {
        title: 'Power (kW)',
        titlefont: { color: 'rgb(219, 64, 82)' },
        tickfont: { color: 'rgb(219, 64, 82)' },
        overlaying: 'y',
        side: 'right',
        rangemode: 'tozero'
      },
      height: 500,
      legend: {
        orientation: 'h',
        y: -0.2
      }
    };
  }

  getClassificationName(id: number): string {
    if (!id || !this.classifications) return 'Unknown';
    const classification = this.classifications.find(c => c.id === id);
    return classification ? classification.name : 'Unknown';
  }

  // Methods for the template
  getMaxPower(): number {
    if (!this.meteringData || this.meteringData.length === 0) return 0;
    return Math.max(...this.meteringData.map(item => item?.power || 0));
  }

  getTotalEnergy(): number {
    if (!this.meteringData || this.meteringData.length === 0) return 0;
    return this.meteringData.reduce((sum, item) => sum + (item?.energyValue || 0), 0);
  }
}
