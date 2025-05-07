import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  meteringData: any[] = [];
  classifications: any[] = [];
  selectedClassification = 'all';
  timeRange = 'day';
  loading = false;
  error: string | null = null;
  summaryMetrics = {
    totalEnergy: 0,
    maxPower: 0,
    avgPower: 0,
    readingCount: 0
  };

  // Chart data properties
  energyChartData: any;
  powerChartData: any;
  distributionChartData: any;
  hourlyChartData: any;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.loading = true;
    this.error = null;

    // Fetch classifications and metering data in parallel
    Promise.all([
      this.apiService.getClassifications().toPromise(),
      this.apiService.getMeteringData().toPromise()
    ]).then(([classifications, meteringData]) => {
      this.classifications = classifications || [];
      this.meteringData = meteringData || [];
      this.updateDashboard();
    }).catch(error => {
      console.error('Error fetching dashboard data:', error);
      this.error = 'Failed to load data. Please try again later.';
    }).finally(() => {
      this.loading = false;
    });
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

  getFilteredData(): any[] {
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

  calculateSummaryMetrics(filteredData: any[]): void {
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

  updateCharts(filteredData: any[]): void {
    if (!filteredData || filteredData.length === 0) {
      this.energyChartData = null;
      this.powerChartData = null;
      this.distributionChartData = null;
      this.hourlyChartData = null;
      return;
    }

    // Energy consumption over time chart
    this.energyChartData = {
      labels: filteredData.map(data => new Date(data.timestamp).toLocaleString()),
      datasets: [{
        label: 'Energy Consumption (kWh)',
        data: filteredData.map(data => data.energyValue),
        backgroundColor: 'rgba(66, 133, 244, 0.2)',
        borderColor: 'rgb(66, 133, 244)',
        borderWidth: 1
      }]
    };

    // Power over time chart
    this.powerChartData = {
      labels: filteredData.map(data => new Date(data.timestamp).toLocaleString()),
      datasets: [{
        label: 'Power (kW)',
        data: filteredData.map(data => data.power),
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderColor: 'rgb(255, 159, 64)',
        borderWidth: 1
      }]
    };

    // Energy distribution by classification chart
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

    this.distributionChartData = {
      labels: Object.keys(energyByClass),
      datasets: [{
        label: 'Energy Consumption (kWh)',
        data: Object.values(energyByClass),
        backgroundColor: [
          'rgba(66, 133, 244, 0.7)',
          'rgba(219, 68, 55, 0.7)',
          'rgba(244, 180, 0, 0.7)',
          'rgba(15, 157, 88, 0.7)',
          'rgba(171, 71, 188, 0.7)',
          'rgba(0, 172, 193, 0.7)'
        ],
        borderWidth: 1
      }]
    };
  }

  updateHourlyChart(filteredData: any[]): void {
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

    this.hourlyChartData = {
      labels: Array.from({ length: 24 }, (_, i) => i),
      datasets: [{
        label: 'Avg. Power by Hour (kW)',
        data: hourlyAvg,
        backgroundColor: 'rgba(66, 133, 244, 0.7)',
        borderColor: 'rgb(66, 133, 244)',
        borderWidth: 1
      }]
    };
  }
}
