// src/app/components/advanced-analysis/advanced-analysis.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlotlyModule } from 'angular-plotly.js';
import { ApiService } from '../../services/api.service';
import { ChartService } from '../../services/chart.service';
import { MeteringData, Classification } from '../../models/models';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-advanced-analysis',
  templateUrl: './advanced-analysis.component.html',
  styleUrls: ['./advanced-analysis.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, PlotlyModule]
})
export class AdvancedAnalysisComponent implements OnInit {
  meteringData: MeteringData[] = [];
  classifications: Classification[] = [];
  loading = false;
  error: string | null = null;

  analysisConfig = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    classificationIds: [] as number[],
    viewType: 'hourlyHeatmap',
    comparisonType: 'none'
  };

  // Plotly chart data and layout
  analysisData: any[] = [];
  chartLayout: any = {};
  chartConfig = { responsive: true };

  constructor(
    private apiService: ApiService,
    private chartService: ChartService
  ) { }

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
      this.performAnalysis();
    }).catch(error => {
      console.error('Error fetching data:', error);
      this.error = 'Failed to load data. Please try again later.';
    }).finally(() => {
      this.loading = false;
    });
  }

  handleConfigChange(event: any): void {
    const { name, value, type } = event.target;

    if (name === 'classificationIds' && type === 'select-multiple') {
      const options = event.target.options;
      const selectedValues = [];
      for (let i = 0; i < options.length; i++) {
        if (options[i].selected) {
          selectedValues.push(parseInt(options[i].value));
        }
      }

      this.analysisConfig = {
        ...this.analysisConfig,
        classificationIds: selectedValues
      };
    } else {
      this.analysisConfig = {
        ...this.analysisConfig,
        [name]: value
      };
    }

    this.performAnalysis();
  }

  performAnalysis(): void {
    // Filter data based on dates and classifications
    const filteredData = this.getFilteredData();

    if (filteredData.length === 0) {
      this.analysisData = [];
      return;
    }

    // Perform different analyses based on viewType
    switch (this.analysisConfig.viewType) {
      case 'hourlyHeatmap':
        this.generateHourlyHeatmap(filteredData);
        break;
      case 'weekdayComparison':
        this.generateWeekdayComparison(filteredData);
        break;
      case 'consumptionTrend':
        this.generateConsumptionTrend(filteredData);
        break;
      case 'classificationComparison':
        this.generateClassificationComparison(filteredData);
        break;
      default:
        this.analysisData = [];
    }
  }

  getFilteredData(): MeteringData[] {
    let filteredData = [...this.meteringData];

    // Filter by dates
    filteredData = filteredData.filter(data =>
      new Date(data.timestamp) >= new Date(this.analysisConfig.startDate) &&
      new Date(data.timestamp) <= new Date(this.analysisConfig.endDate)
    );

    // Filter by classifications if selected
    if (this.analysisConfig.classificationIds.length > 0) {
      filteredData = filteredData.filter(data =>
        this.analysisConfig.classificationIds.includes(data.classificationId)
      );
    }

    return filteredData;
  }

  generateHourlyHeatmap(filteredData: MeteringData[]): void {
    // Create 2D grid for day of week vs hour of day
    const heatmapData = Array(7).fill(0).map(() => Array(24).fill(0));
    const countData = Array(7).fill(0).map(() => Array(24).fill(0));

    filteredData.forEach(item => {
      const date = new Date(item.timestamp);
      const dayOfWeek = date.getDay(); // 0-6
      const hourOfDay = date.getHours(); // 0-23

      heatmapData[dayOfWeek][hourOfDay] += item.power;
      countData[dayOfWeek][hourOfDay]++;
    });

    // Calculate averages
    const avgData = heatmapData.map((day, dayIndex) =>
      day.map((total, hourIndex) =>
        countData[dayIndex][hourIndex] > 0
          ? total / countData[dayIndex][hourIndex]
          : 0
      )
    );

    this.analysisData = [{
      z: avgData,
      x: Array.from({ length: 24 }, (_, i) => i),
      y: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      type: 'heatmap',
      colorscale: 'Viridis',
      colorbar: {
        title: 'Power (kW)'
      }
    }];

    this.chartLayout = this.chartService.getHeatmapLayout('Energy Usage by Hour and Day');
  }

  generateWeekdayComparison(filteredData: MeteringData[]): void {
    const weekdayData = Array(7).fill(0);
    const countData = Array(7).fill(0);

    filteredData.forEach(item => {
      const dayOfWeek = new Date(item.timestamp).getDay();
      weekdayData[dayOfWeek] += item.energyValue;
      countData[dayOfWeek]++;
    });

    // Calculate averages
    const avgData = weekdayData.map((total, index) =>
      countData[index] > 0 ? total / countData[index] : 0
    );

    this.analysisData = [{
      x: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      y: avgData,
      type: 'bar',
      marker: {
        color: 'rgba(55, 128, 191, 0.7)'
      }
    }];

    this.chartLayout = this.chartService.getBarChartLayout(
      'Average Energy Usage by Day of Week',
      'Day of Week',
      'Average Energy (kWh)'
    );
  }

  generateConsumptionTrend(filteredData: MeteringData[]): void {
    // Group by date
    const dailyData: { [key: string]: { energy: number, power: number, count: number } } = {};

    filteredData.forEach(item => {
      const dateStr = new Date(item.timestamp).toISOString().split('T')[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          energy: 0,
          power: 0,
          count: 0
        };
      }

      dailyData[dateStr].energy += item.energyValue;
      dailyData[dateStr].power += item.power;
      dailyData[dateStr].count++;
    });

    // Convert to arrays for plotting
    const dates = Object.keys(dailyData).sort();
    const energyValues = dates.map(date => dailyData[date].energy);
    const powerValues = dates.map(date =>
      dailyData[date].count > 0
        ? dailyData[date].power / dailyData[date].count
        : 0
    );

    this.analysisData = [
      {
        x: dates,
        y: energyValues,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Energy (kWh)',
        marker: { color: 'blue' }
      },
      {
        x: dates,
        y: powerValues,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Avg Power (kW)',
        yaxis: 'y2',
        marker: { color: 'red' }
      }
    ];

    this.chartLayout = {
      ...this.chartService.getDefaultLayout('Energy Consumption Trend'),
      height: 500,
      xaxis: {
        title: 'Date',
        tickangle: -45
      },
      yaxis: {
        title: 'Energy (kWh)'
      },
      yaxis2: {
        title: 'Power (kW)',
        titlefont: { color: 'red' },
        tickfont: { color: 'red' },
        overlaying: 'y',
        side: 'right'
      },
      legend: {
        orientation: 'h',
        y: -0.2
      }
    };
  }

  generateClassificationComparison(filteredData: MeteringData[]): void {
    // Group by classification
    const classData: { [key: string]: { energy: number, maxPower: number, totalPower: number, count: number } } = {};

    filteredData.forEach(item => {
      const classId = item.classificationId;
      const className = this.classifications.find(c => c.id === classId)?.name || 'Unknown';

      if (!classData[className]) {
        classData[className] = {
          energy: 0,
          maxPower: 0,
          totalPower: 0,
          count: 0
        };
      }

      classData[className].energy += item.energyValue;
      classData[className].maxPower = Math.max(classData[className].maxPower, item.power);
      classData[className].totalPower += item.power;
      classData[className].count++;
    });

    // Calculate values for comparison
    const classNames = Object.keys(classData);
    const energyValues = classNames.map(name => classData[name].energy);
    const avgPowerValues = classNames.map(name =>
      classData[name].count > 0
        ? classData[name].totalPower / classData[name].count
        : 0
    );

    // Sort by energy consumption (descending)
    const sortedIndices = energyValues
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => b.val - a.val)
      .map(item => item.idx);

    const sortedNames = sortedIndices.map(idx => classNames[idx]);
    const sortedEnergy = sortedIndices.map(idx => energyValues[idx]);
    const sortedPower = sortedIndices.map(idx => avgPowerValues[idx]);

    this.analysisData = [
      {
        x: sortedNames,
        y: sortedEnergy,
        type: 'bar',
        name: 'Energy (kWh)',
        marker: { color: 'rgba(55, 128, 191, 0.7)' }
      },
      {
        x: sortedNames,
        y: sortedPower,
        type: 'bar',
        name: 'Avg Power (kW)',
        marker: { color: 'rgba(219, 64, 82, 0.7)' }
      }
    ];

    this.chartLayout = {
      ...this.chartService.getDefaultLayout('Energy Consumption by Classification'),
      height: 500,
      barmode: 'group',
      xaxis: {
        title: 'Classification',
        tickangle: -45
      },
      yaxis: {
        title: 'Value'
      },
      legend: {
        orientation: 'h',
        y: -0.2
      }
    };
  }
}
