// src/app/components/pareto-analysis/pareto-analysis.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-pareto-analysis',
  templateUrl: './pareto-analysis.component.html',
  styleUrls: ['./pareto-analysis.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
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

  // Chart configuration
  chartData: any;
  chartOptions: any;

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
      this.chartData = null;
      return;
    }

    this.chartData = {
      labels: this.paretoData.map(item => item.label),
      datasets: [
        {
          label: this.formConfig.metricType === 'energy' ? 'Energy (kWh)' : 'Power (kW)',
          data: this.paretoData.map(item => item.value),
          backgroundColor: 'rgba(55, 128, 191, 0.7)',
          order: 1
        },
        {
          label: 'Cumulative %',
          data: this.paretoData.map(item => item.cumulativePercent),
          type: 'line',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          pointRadius: 4,
          yAxisID: 'percentage',
          order: 0
        }
      ]
    };

    this.chartOptions = {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: this.getXAxisLabel()
          },
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          title: {
            display: true,
            text: this.formConfig.metricType === 'energy' ? 'Energy (kWh)' : 'Power (kW)'
          },
          beginAtZero: true
        },
        percentage: {
          position: 'right',
          title: {
            display: true,
            text: 'Cumulative Percentage'
          },
          min: 0,
          max: 100,
          ticks: {
            callback: function (value: any) {
              return value + '%';
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context: any) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return label + ': ' + value + (context.datasetIndex === 1 ? '%' : '');
            }
          }
        }
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
