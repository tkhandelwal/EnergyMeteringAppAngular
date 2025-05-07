// src/app/components/pareto-analysis/pareto-analysis.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlotlyModule } from 'angular-plotly.js';
import * as Plotly from 'plotly.js-dist';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-pareto-analysis',
  templateUrl: './pareto-analysis.component.html',
  styleUrls: ['./pareto-analysis.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, PlotlyModule]
})
export class ParetoAnalysisComponent implements OnInit {
  meteringData: any[] = [];
  classifications: any[] = [];
  loading = false;
  error: string | null = null;

  formConfig = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    groupBy: 'classification',
    metricType: 'energy'
  };

  // Data for Pareto chart and table
  paretoData: any[] = [];

  // Plotly specific chart configuration
  plotlyData: any[] = [];
  plotlyLayout: any = {};
  plotlyConfig: any = { responsive: true };

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.loading = true;
    this.error = null;

    // Fetch classifications and metering data in parallel
    Promise.all([
      firstValueFrom(this.apiService.getClassifications()),
      firstValueFrom(this.apiService.getMeteringData())
    ]).then(([classifications, meteringData]) => {
      this.classifications = classifications || [];
      this.meteringData = meteringData || [];
      this.updateParetoAnalysis();
    }).catch(error => {
      console.error('Error fetching data:', error);
      this.error = 'Failed to load data. Please try again later.';
    }).finally(() => {
      this.loading = false;
    });
  }

  handleConfigChange(event: any): void {
    this.formConfig = {
      ...this.formConfig,
      [event.target.name]: event.target.value
    };
    this.updateParetoAnalysis();
  }

  getFilteredData(): any[] {
    return this.meteringData.filter(data =>
      new Date(data.timestamp) >= new Date(this.formConfig.startDate) &&
      new Date(data.timestamp) <= new Date(this.formConfig.endDate)
    );
  }

  updateParetoAnalysis(): void {
    const filteredData = this.getFilteredData();

    if (filteredData.length === 0) {
      this.paretoData = [];
      this.updateChartConfig();
      return;
    }

    // Group data based on selected grouping
    const groupedData: { [key: string]: number } = {};

    filteredData.forEach(data => {
      let key: string;

      switch (this.formConfig.groupBy) {
        case 'classification':
          key = data.classification?.name || 'Unknown';
          break;
        case 'dayOfWeek':
          key = new Date(data.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
          break;
        case 'hourOfDay':
          key = `${new Date(data.timestamp).getHours()}:00`;
          break;
        default:
          key = 'Unknown';
      }

      if (!groupedData[key]) {
        groupedData[key] = 0;
      }

      // Add value based on selected metric
      if (this.formConfig.metricType === 'energy') {
        groupedData[key] += data.energyValue;
      } else {
        // For power, we're taking max power for each group
        groupedData[key] = Math.max(groupedData[key], data.power);
      }
    });

    // Convert to array and sort by value (descending)
    const sortedData = Object.entries(groupedData)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));

    // Calculate cumulative percentages
    const total = sortedData.reduce((sum, item) => sum + item.value, 0);
    let cumulativeSum = 0;

    this.paretoData = sortedData.map(item => {
      const percentOfTotal = (item.value / total) * 100;
      cumulativeSum += item.value;
      const cumulativePercent = (cumulativeSum / total) * 100;

      return {
        label: item.label,
        value: parseFloat(item.value.toFixed(2)),
        percentOfTotal: parseFloat(percentOfTotal.toFixed(2)),
        cumulativePercent: parseFloat(cumulativePercent.toFixed(2))
      };
    });

    // Update chart configuration
    this.updateChartConfig();
  }

  updateChartConfig(): void {
    if (this.paretoData.length === 0) {
      this.plotlyData = [];
      this.plotlyLayout = {};
      return;
    }

    // Bar chart data
    const barTrace = {
      x: this.paretoData.map(item => item.label),
      y: this.paretoData.map(item => item.value),
      type: 'bar',
      name: this.formConfig.metricType === 'energy' ? 'Energy (kWh)' : 'Power (kW)',
      marker: {
        color: 'rgba(55, 128, 191, 0.7)'
      }
    };

    // Line chart data for cumulative percentage
    const lineTrace = {
      x: this.paretoData.map(item => item.label),
      y: this.paretoData.map(item => item.cumulativePercent),
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Cumulative %',
      yaxis: 'y2',
      line: {
        color: 'rgba(255, 99, 132, 1)'
      },
      marker: {
        color: 'rgba(255, 99, 132, 1)'
      }
    };

    this.plotlyData = [barTrace, lineTrace];

    this.plotlyLayout = {
      title: 'Pareto Analysis',
      xaxis: {
        title: this.getXAxisLabel(),
        tickangle: -45
      },
      yaxis: {
        title: this.formConfig.metricType === 'energy' ? 'Energy (kWh)' : 'Power (kW)'
      },
      yaxis2: {
        title: 'Cumulative %',
        titlefont: { color: 'rgb(255, 99, 132)' },
        tickfont: { color: 'rgb(255, 99, 132)' },
        overlaying: 'y',
        side: 'right',
        range: [0, 100],
        ticksuffix: '%'
      },
      height: 500,
      margin: {
        l: 50,
        r: 50,
        b: 100,
        t: 50,
        pad: 4
      }
    };
  }

  getXAxisLabel(): string {
    switch (this.formConfig.groupBy) {
      case 'classification':
        return 'Classification';
      case 'dayOfWeek':
        return 'Day of Week';
      case 'hourOfDay':
        return 'Hour of Day';
      default:
        return '';
    }
  }
}
