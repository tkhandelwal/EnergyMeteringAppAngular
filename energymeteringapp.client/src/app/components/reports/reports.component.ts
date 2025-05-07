// src/app/components/reports/reports.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
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
  paretoData: any = null;
  enpiData: any = null;

  // Aggregated data for table view
  tableData: any[] = [];

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
      const selectedValues = [];
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
      this.paretoData = null;
      this.enpiData = null;
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
    this.tableData = Object.entries(classData).map(([name, data]: [string, any]) => ({
      name,
      type: data.type,
      totalEnergy: parseFloat(data.totalEnergy.toFixed(2)),
      maxPower: parseFloat(data.maxPower.toFixed(2)),
      avgPower: data.readings > 0
        ? parseFloat((data.totalEnergy / data.readings * 4).toFixed(2))
        : 0
    })).filter(item => item.totalEnergy > 0); // Only show items with data
  }

  updateSankeyData(filteredData: any[]): void {
    // This is a placeholder for Sankey diagram data
    // In a real implementation, this would prepare data for a Sankey diagram library
    this.sankeyData = {
      nodes: [
        { name: 'Source' },
        { name: 'Equipment' },
        { name: 'Facility' },
        { name: 'Production' }
        // Additional nodes would be generated based on actual classifications
      ],
      links: [
        { source: 0, target: 1, value: 100 },
        { source: 0, target: 2, value: 150 },
        { source: 0, target: 3, value: 50 }
        // Additional links would be generated based on energy values
      ]
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

    this.paretoData = sortedData.map(item => {
      runningSum += item.value;
      return {
        name: item.name,
        value: item.value,
        percentage: (item.value / totalEnergy) * 100,
        cumulativePercentage: (runningSum / totalEnergy) * 100
      };
    });
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
    this.enpiData = Object.entries(classData).map(([name, data]: [string, any]) => ({
      name,
      energyPerHour: parseFloat((data.totalEnergy / timeRangeHours).toFixed(2)),
      maxPower: parseFloat(data.maxPower.toFixed(2))
    })).sort((a, b) => b.energyPerHour - a.energyPerHour);
  }
}
