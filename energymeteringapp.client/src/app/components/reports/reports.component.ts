// src/app/components/reports/reports.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlotlyModule } from 'angular-plotly.js';
import * as Plotly from 'plotly.js-dist';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';

interface ParetoItem {
  name: string;
  value: number;
  percentage: number;
  cumulativePercentage: number;
}

interface EnpiItem {
  name: string;
  energyPerHour: number;
  maxPower: number;
}

interface TableItem {
  name: string;
  type: string;
  totalEnergy: number;
  maxPower: number;
  avgPower: number;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, PlotlyModule]
})
export class ReportsComponent implements OnInit {
  meteringData: any[] = [];
  classifications: any[] = [];
  loading = false;
  error: string | null = null;

  reportConfig = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    classificationIds: [] as number[],
    reportType: 'energyFlow'
  };

  // Chart data for various report types
  sankeyData: any = null;
  paretoData: ParetoItem[] = [];
  enpiData: EnpiItem[] = [];

  // Plotly specific data structures
  paretoPlotData: any[] = [];
  paretoPlotLayout: any = {};
  enpiPlotData: any[] = [];
  enpiPlotLayout: any = {};
  sankeyPlotData: any[] = [];
  sankeyPlotLayout: any = {};

  // Aggregated data for table view
  tableData: TableItem[] = [];

  constructor(private apiService: ApiService) { }

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
      this.updateReport();
    } catch (error) {
      console.error('Error fetching report data:', error);
      this.error = 'Failed to load data. Please try again later.';
    } finally {
      this.loading = false;
    }
  }

  handleChange(event: any): void {
    const { name, value } = event.target;

    if (name === 'classificationIds') {
      // Handle multi-select
      const options = event.target.options;
      const selectedValues: number[] = [];
      for (let i = 0; i < options.length; i++) {
        if (options[i].selected) {
          selectedValues.push(parseInt(options[i].value));
        }
      }
      this.reportConfig.classificationIds = selectedValues;
    } else {
      this.reportConfig = {
        ...this.reportConfig,
        [name]: value
      };
    }

    this.updateReport();
  }

  updateReport(): void {
    const filteredData = this.getFilteredData();

    if (filteredData.length === 0) {
      this.sankeyData = null;
      this.paretoData = [];
      this.enpiData = [];
      this.tableData = [];
      return;
    }

    // Update table data (always shown)
    this.updateTableData(filteredData);

    // Update specific report data based on type
    switch (this.reportConfig.reportType) {
      case 'energyFlow':
        this.updateSankeyData(filteredData);
        break;
      case 'pareto':
        this.updateParetoData(filteredData);
        break;
      case 'enpi':
        this.updateEnPIData(filteredData);
        break;
    }
  }

  getFilteredData(): any[] {
    let filtered = [...this.meteringData];

    // Filter by date range
    filtered = filtered.filter(data =>
      new Date(data.timestamp) >= new Date(this.reportConfig.startDate) &&
      new Date(data.timestamp) <= new Date(this.reportConfig.endDate)
    );

    // Filter by selected classifications
    if (this.reportConfig.classificationIds.length > 0) {
      filtered = filtered.filter(data =>
        this.reportConfig.classificationIds.includes(data.classificationId));
    }

    return filtered;
  }

  updateTableData(filteredData: any[]): void {
    // Group data by classification
    const classData: { [key: string]: any } = {};

    // Initialize with all classifications
    this.classifications.forEach(classification => {
      classData[classification.name] = {
        type: classification.type,
        totalEnergy: 0,
        maxPower: 0,
        readings: 0
      };
    });

    // Aggregate data by classification
    filteredData.forEach(data => {
      const className = data.classification?.name || 'Unknown';
      const classType = data.classification?.type || 'Unknown';

      if (!classData[className]) {
        classData[className] = {
          type: classType,
          totalEnergy: 0,
          maxPower: 0,
          readings: 0
        };
      }

      classData[className].totalEnergy += data.energyValue;
      classData[className].readings++;

      if (data.power > classData[className].maxPower) {
        classData[className].maxPower = data.power;
      }
    });

    // Convert to array and calculate averages
    this.tableData = Object.entries(classData)
      .map(([name, data]: [string, any]): TableItem => ({
        name,
        type: data.type,
        totalEnergy: parseFloat(data.totalEnergy.toFixed(2)),
        maxPower: parseFloat(data.maxPower.toFixed(2)),
        avgPower: data.readings > 0
          ? parseFloat((data.totalEnergy / data.readings * 4).toFixed(2))
          : 0
      }))
      .filter(item => item.totalEnergy > 0); // Only show items with data
  }

  updateSankeyData(filteredData: any[]): void {
    // Create a placeholder for Sankey diagram data
    this.sankeyData = {
      nodes: [
        { name: 'Source' },
        { name: 'Equipment' },
        { name: 'Facility' },
        { name: 'Production' }
      ],
      links: [
        { source: 0, target: 1, value: 100 },
        { source: 0, target: 2, value: 150 },
        { source: 0, target: 3, value: 50 }
      ]
    };

    // In a real implementation you would create Plotly-compatible data here
    this.sankeyPlotData = [{
      type: "sankey",
      orientation: "h",
      node: {
        pad: 15,
        thickness: 20,
        line: {
          color: "black",
          width: 0.5
        },
        label: ["Source", "Equipment", "Facility", "Production"],
        color: ["blue", "green", "red", "orange"]
      },
      link: {
        source: [0, 0, 0],
        target: [1, 2, 3],
        value: [100, 150, 50],
        color: ["rgba(0, 0, 255, 0.2)", "rgba(0, 255, 0, 0.2)", "rgba(255, 0, 0, 0.2)"]
      }
    }];

    this.sankeyPlotLayout = {
      title: "Energy Flow Sankey Diagram",
      font: {
        size: 10
      },
      height: 500
    };
  }

  updateParetoData(filteredData: any[]): void {
    // Group energy consumption by classification
    const energyByClass: { [key: string]: number } = {};

    filteredData.forEach(data => {
      const className = data.classification?.name || 'Unknown';
      if (!energyByClass[className]) {
        energyByClass[className] = 0;
      }
      energyByClass[className] += data.energyValue;
    });

    // Sort by energy consumption (descending)
    const sortedData = Object.entries(energyByClass)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    // Calculate cumulative percentages
    const totalEnergy = sortedData.reduce((sum, item) => sum + item.value, 0);
    let runningSum = 0;

    this.paretoData = sortedData.map((item): ParetoItem => {
      runningSum += item.value;
      return {
        name: item.name,
        value: item.value,
        percentage: (item.value / totalEnergy) * 100,
        cumulativePercentage: (runningSum / totalEnergy) * 100
      };
    });

    // Create Plotly-specific data for Pareto chart
    this.paretoPlotData = [
      {
        x: this.paretoData.map((item: ParetoItem) => item.name),
        y: this.paretoData.map((item: ParetoItem) => item.value),
        type: 'bar',
        name: 'Energy Consumption (kWh)',
        marker: {
          color: 'rgba(55, 128, 191, 0.7)'
        }
      },
      {
        x: this.paretoData.map((item: ParetoItem) => item.name),
        y: this.paretoData.map((item: ParetoItem) => item.cumulativePercentage),
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
      }
    ];

    this.paretoPlotLayout = {
      title: 'Pareto Analysis of Energy Consumption',
      xaxis: {
        title: 'Classification',
        tickangle: -45
      },
      yaxis: {
        title: 'Energy (kWh)'
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
      height: 500
    };
  }

  updateEnPIData(filteredData: any[]): void {
    // Group by classification and calculate EnPI (Energy per time period)
    const classData: { [key: string]: any } = {};
    const timeRangeHours = (new Date(this.reportConfig.endDate).getTime() -
      new Date(this.reportConfig.startDate).getTime()) / (1000 * 60 * 60);

    filteredData.forEach(data => {
      const className = data.classification?.name || 'Unknown';
      if (!classData[className]) {
        classData[className] = {
          totalEnergy: 0,
          maxPower: 0
        };
      }

      classData[className].totalEnergy += data.energyValue;
      if (data.power > classData[className].maxPower) {
        classData[className].maxPower = data.power;
      }
    });

    // Calculate EnPI values (kWh/hour and kW max)
    this.enpiData = Object.entries(classData).map(([name, data]: [string, any]): EnpiItem => ({
      name,
      energyPerHour: parseFloat((data.totalEnergy / timeRangeHours).toFixed(2)),
      maxPower: parseFloat(data.maxPower.toFixed(2))
    })).sort((a, b) => b.energyPerHour - a.energyPerHour);

    // Create Plotly-specific data for EnPI chart
    this.enpiPlotData = [
      {
        x: this.enpiData.map((item: EnpiItem) => item.name),
        y: this.enpiData.map((item: EnpiItem) => item.energyPerHour),
        type: 'bar',
        name: 'Energy Intensity (kWh/hour)',
        marker: {
          color: 'rgba(55, 128, 191, 0.7)'
        }
      },
      {
        x: this.enpiData.map((item: EnpiItem) => item.name),
        y: this.enpiData.map((item: EnpiItem) => item.maxPower),
        type: 'bar',
        name: 'Max Power (kW)',
        marker: {
          color: 'rgba(255, 99, 132, 0.7)'
        }
      }
    ];

    this.enpiPlotLayout = {
      title: 'Energy Performance Indicators',
      xaxis: {
        title: 'Classification',
        tickangle: -45
      },
      yaxis: {
        title: 'Value',
        zeroline: true
      },
      barmode: 'group',
      height: 500
    };
  }
}
