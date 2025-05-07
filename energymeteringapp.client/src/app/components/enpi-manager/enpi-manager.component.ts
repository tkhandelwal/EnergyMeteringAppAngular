// energymeteringapp.client/src/app/components/enpi-manager/enpi-manager.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlotlyModule } from 'angular-plotly.js';
import { ApiService } from '../../services/api.service';
import { ChartService } from '../../services/chart.service';

@Component({
  selector: 'app-enpi-manager',
  templateUrl: './enpi-manager.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, PlotlyModule]
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

  // Chart data
  enpiChartData: any[] = [];
  enpiChartLayout: any = {};

  constructor(
    private apiService: ApiService,
    private chartService: ChartService
  ) { }

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
        this.updateEnPIChart();
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

  updateEnPIChart(): void {
    if (this.enpiList.length === 0) {
      this.enpiChartData = [];
      return;
    }

    // Group EnPIs by classification
    const groupedEnpis: { [key: string]: any[] } = {};
    this.enpiList.forEach(enpi => {
      const classificationName = enpi.classification?.name || 'Unknown';
      if (!groupedEnpis[classificationName]) {
        groupedEnpis[classificationName] = [];
      }
      groupedEnpis[classificationName].push(enpi);
    });

    // Create chart data
    this.enpiChartData = [];

    // Bar chart for current values
    const currentValues = {
      x: this.enpiList.map(e => e.name),
      y: this.enpiList.map(e => e.currentValue),
      type: 'bar',
      name: 'Current Value',
      marker: { color: 'rgba(55, 128, 191, 0.7)' }
    };

    // Bar chart for baseline values
    const baselineValues = {
      x: this.enpiList.map(e => e.name),
      y: this.enpiList.map(e => e.baselineValue),
      type: 'bar',
      name: 'Baseline Value',
      marker: { color: 'rgba(219, 64, 82, 0.7)' }
    };

    // Add improvement percentage as a line
    const improvements = {
      x: this.enpiList.map(e => e.name),
      y: this.enpiList.map(e => e.baselineValue > 0 ?
        ((e.baselineValue - e.currentValue) / e.baselineValue * 100) : 0),
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Improvement %',
      yaxis: 'y2',
      marker: { color: 'rgba(50, 171, 96, 1)' }
    };

    this.enpiChartData = [currentValues, baselineValues, improvements];

    this.enpiChartLayout = {
      title: 'Energy Performance Indicators',
      barmode: 'group',
      xaxis: {
        title: 'EnPI Name',
        tickangle: -45
      },
      yaxis: {
        title: 'Value'
      },
      yaxis2: {
        title: 'Improvement %',
        titlefont: { color: 'rgb(50, 171, 96)' },
        tickfont: { color: 'rgb(50, 171, 96)' },
        overlaying: 'y',
        side: 'right',
        showgrid: false,
        range: [0, 100]
      },
      height: 500,
      legend: {
        orientation: 'h',
        y: -0.2
      }
    };
  }
}
