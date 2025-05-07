// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlotlyModule } from 'angular-plotly.js';
import { ApiService } from '../../services/api.service';
import { ChartService } from '../../services/chart.service';
import { MeteringData, Classification } from '../../models/models';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  //styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, PlotlyModule]
})
export class DashboardComponent implements OnInit {
  meteringData: MeteringData[] = [];
  classifications: Classification[] = [];
  selectedClassification = 'all';
  timeRange = 'day';
  loading = false;
  error: string | null = null;

  // Summary metrics
  summaryMetrics = {
    totalEnergy: 0,
    maxPower: 0,
    avgPower: 0,
    readingCount: 0
  };

  // Plotly chart data
  energyChartData: any[] = [];
  energyChartLayout: any = {};

  powerChartData: any[] = [];
  powerChartLayout: any = {};

  distributionChartData: any[] = [];
  distributionChartLayout: any = {};

  hourlyChartData: any[] = [];
  hourlyChartLayout: any = {};

  constructor(
    private apiService: ApiService,
    private chartService: ChartService
  ) { }

  ngOnInit(): void {
    this.fetchData();
  }

  async fetchData(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      // Fetch classifications and metering data in parallel
      const [classifications, meteringData] = await Promise.all([
        firstValueFrom(this.apiService.getClassifications()),
        firstValueFrom(this.apiService.getMeteringData())
      ]);

      this.classifications = classifications || [];
      this.meteringData = meteringData || [];
      this.updateDashboard();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      this.error = 'Failed to load data. Please try again later.';
    } finally {
      this.loading = false;
    }
  }

  handleClassificationChange(event: any): void {
    this.selectedClassification = event.target.value;
    this.updateDashboard();
  }

  handleTimeRangeChange(event: any): void {
    this.timeRange = event.target.value;
    this.updateDashboard();
  }

  updateDashboard(): void {
    const filteredData = this.getFilteredData();
    this.calculateSummaryMetrics(filteredData);
    this.updateCharts(filteredData);
  }

  getFilteredData(): MeteringData[] {
    let filtered = [...this.meteringData];

    // Filter by classification
    if (this.selectedClassification !== 'all') {
      filtered = filtered.filter(data =>
        data.classificationId === parseInt(this.selectedClassification));
    }

    // Filter by time range
    let startTime: Date;
    const now = new Date();

    switch (this.timeRange) {
      case 'day':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    filtered = filtered.filter(data => new Date(data.timestamp) > startTime);
    return filtered;
  }

  calculateSummaryMetrics(filteredData: MeteringData[]): void {
    if (!filteredData || filteredData.length === 0) {
      this.summaryMetrics = {
        totalEnergy: 0,
        maxPower: 0,
        avgPower: 0,
        readingCount: 0
      };
      return;
    }

    const totalEnergy = filteredData.reduce((sum, item) => sum + item.energyValue, 0);
    const maxPower = Math.max(...filteredData.map(item => item.power));
    const avgPower = filteredData.reduce((sum, item) => sum + item.power, 0) / filteredData.length;

    this.summaryMetrics = {
      totalEnergy: parseFloat(totalEnergy.toFixed(2)),
      maxPower: parseFloat(maxPower.toFixed(2)),
      avgPower: parseFloat(avgPower.toFixed(2)),
      readingCount: filteredData.length
    };
  }

  updateCharts(filteredData: MeteringData[]): void {
    if (!filteredData || filteredData.length === 0) {
      this.energyChartData = [];
      this.powerChartData = [];
      this.distributionChartData = [];
      this.hourlyChartData = [];
      return;
    }

    // Energy consumption over time chart
    this.energyChartData = [{
      x: filteredData.map(data => new Date(data.timestamp)),
      y: filteredData.map(data => data.energyValue),
      type: 'scatter',
      mode: 'lines',
      name: 'Energy Consumption (kWh)',
      line: { color: 'rgb(66, 133, 244)', width: 2 }
    }];

    this.energyChartLayout = this.chartService.getLineChartLayout(
      'Energy Consumption Over Time',
      'Time',
      'Energy (kWh)'
    );

    // Power over time chart
    this.powerChartData = [{
      x: filteredData.map(data => new Date(data.timestamp)),
      y: filteredData.map(data => data.power),
      type: 'scatter',
      mode: 'lines',
      name: 'Power (kW)',
      line: { color: 'rgb(255, 159, 64)', width: 2 }
    }];

    this.powerChartLayout = this.chartService.getLineChartLayout(
      'Power Demand Over Time',
      'Time',
      'Power (kW)'
    );

    // Distribution by classification chart
    this.updateDistributionChart();

    // Hourly usage chart
    this.updateHourlyChart(filteredData);
  }

  updateDistributionChart(): void {
    // Group data by classification
    const energyByClass: { [key: string]: number } = {};

    this.meteringData.forEach(data => {
      const classificationName = data.classification?.name || 'Unknown';
      if (!energyByClass[classificationName]) {
        energyByClass[classificationName] = 0;
      }
      energyByClass[classificationName] += data.energyValue;
    });

    // Convert to arrays for Plotly
    const labels = Object.keys(energyByClass);
    const values = Object.values(energyByClass);

    this.distributionChartData = [{
      labels: labels,
      values: values,
      type: 'pie',
      hole: 0.4,
      marker: {
        colors: this.chartService.getColorScale(labels.length)
      },
      textinfo: 'label+percent',
      insidetextorientation: 'radial'
    }];

    this.distributionChartLayout = {
      ...this.chartService.getDefaultLayout('Energy Distribution by Classification'),
      showlegend: false
    };
  }

  updateHourlyChart(filteredData: MeteringData[]): void {
    // Group data by hour of day
    const hourlyData = Array(24).fill(0);
    const hourlyCount = Array(24).fill(0);

    filteredData.forEach(data => {
      const hour = new Date(data.timestamp).getHours();
      hourlyData[hour] += data.power;
      hourlyCount[hour]++;
    });

    // Calculate averages
    const hourlyAvg = hourlyData.map((total, i) =>
      hourlyCount[i] > 0 ? total / hourlyCount[i] : 0);

    this.hourlyChartData = [{
      x: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      y: hourlyAvg,
      type: 'bar',
      marker: {
        color: 'rgba(66, 133, 244, 0.7)',
        line: {
          color: 'rgb(66, 133, 244)',
          width: 1.5
        }
      }
    }];

    this.hourlyChartLayout = this.chartService.getBarChartLayout(
      'Average Power by Hour of Day',
      'Hour of Day',
      'Average Power (kW)'
    );
  }
}
