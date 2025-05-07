// energymeteringapp.client/src/app/components/energy-flow-analysis/energy-flow-analysis.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { PlotlyModule } from 'angular-plotly.js';
import { ChartService } from '../../services/chart.service';

// Define interfaces for tree node structure
interface TreeNode {
  name: string;
  value: number;
  children?: TreeNode[];
}

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

@Component({
  selector: 'app-energy-flow-analysis',
  templateUrl: './energy-flow-analysis.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, PlotlyModule]
})
export class EnergyFlowAnalysisComponent implements OnInit {
  meteringData: any[] = [];
  classifications: any[] = [];
  loading = false;
  error: string | null = null;

  dateRange = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  };

  view = 'sankey';

  // Data for different visualizations
  sankeyData: SankeyData | null = null;
  treemapData: any = null;
  heatmapData: any = null;

  // Plotly data objects
  sankeyPlotData: any[] = [];
  sankeyPlotLayout: any = {};
  treemapPlotData: any[] = [];
  treemapPlotLayout: any = {};
  heatmapPlotData: any[] = [];
  heatmapPlotLayout: any = {};

  constructor(
    private apiService: ApiService,
    private chartService: ChartService
  ) { }

  ngOnInit(): void {
    this.fetchClassifications();
    this.fetchMeteringData();
  }

  fetchClassifications(): void {
    this.apiService.getClassifications().subscribe({
      next: (data) => {
        this.classifications = data;
      },
      error: (err) => {
        console.error('Error fetching classifications:', err);
        this.error = 'Failed to load classifications.';
      }
    });
  }

  fetchMeteringData(): void {
    this.loading = true;
    this.apiService.getMeteringData().subscribe({
      next: (data) => {
        this.meteringData = data;
        this.updateVisualization();
      },
      error: (err) => {
        console.error('Error fetching metering data:', err);
        this.error = 'Failed to load metering data.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  handleDateChange(event: any): void {
    this.dateRange = {
      ...this.dateRange,
      [event.target.name]: event.target.value
    };
    this.updateVisualization();
  }

  handleViewChange(event: any): void {
    this.view = event.target.value;
    this.updateVisualization();
  }

  getFilteredData(): any[] {
    // Filter by date range
    return this.meteringData.filter(data =>
      new Date(data.timestamp) >= new Date(this.dateRange.startDate) &&
      new Date(data.timestamp) <= new Date(this.dateRange.endDate)
    );
  }

  updateVisualization(): void {
    const filteredData = this.getFilteredData();

    if (filteredData.length === 0) {
      this.sankeyData = null;
      this.treemapData = null;
      this.heatmapData = null;
      return;
    }

    switch (this.view) {
      case 'sankey':
        this.updateSankeyData(filteredData);
        break;
      case 'treemap':
        this.updateTreemapData(filteredData);
        break;
      case 'heatmap':
        this.updateHeatmapData(filteredData);
        break;
    }
  }

  updateSankeyData(filteredData: any[]): void {
    // Create mappings for classifications and types
    const typeMap: { [key: number]: string } = {};
    this.classifications.forEach(classification => {
      typeMap[classification.id] = classification.type;
    });

    // Group data by type and classification
    const energyByType: { [key: string]: { [key: string]: number } } = {};
    filteredData.forEach(data => {
      const type = typeMap[data.classificationId] || 'Unknown';
      const name = data.classification?.name || 'Unknown';

      if (!energyByType[type]) {
        energyByType[type] = {};
      }
      if (!energyByType[type][name]) {
        energyByType[type][name] = 0;
      }
      energyByType[type][name] += data.energyValue;
    });

    // Build nodes and links for Sankey diagram
    const nodes: any[] = [{ name: 'Total Energy' }];
    const links: any[] = [];
    let nodeIndex = 0;
    const typeNodeIndices: { [key: string]: number } = {};

    // First add all type nodes
    Object.keys(energyByType).forEach(type => {
      nodeIndex++;
      typeNodeIndices[type] = nodeIndex;
      nodes.push({ name: type });
    });

    // Then add all classification nodes and create links
    Object.entries(energyByType).forEach(([type, classifications]) => {
      const typeNodeIndex = typeNodeIndices[type];

      // Calculate total for this type
      const typeTotal = Object.values(classifications)
        .reduce((sum, value) => sum + value, 0);

      // Link from total to type
      links.push({
        source: 0,
        target: typeNodeIndex,
        value: typeTotal
      });

      // Add each classification within this type
      Object.entries(classifications).forEach(([name, value]) => {
        nodeIndex++;
        nodes.push({ name });

        // Link from type to classification
        links.push({
          source: typeNodeIndex,
          target: nodeIndex,
          value: value
        });
      });
    });

    // Set up Plotly Sankey data
    this.sankeyData = { nodes, links };

    this.sankeyPlotData = [{
      type: "sankey",
      orientation: "h",
      node: {
        pad: 15,
        thickness: 20,
        line: { color: "black", width: 0.5 },
        label: nodes.map(n => n.name),
        color: this.chartService.getColorScale(nodes.length)
      },
      link: {
        source: links.map(l => l.source),
        target: links.map(l => l.target),
        value: links.map(l => l.value),
        color: links.map(l => Array.isArray(l.color) ? l.color : 'rgba(55, 128, 191, 0.3)')
      }
    }];

    this.sankeyPlotLayout = {
      title: "Energy Flow Sankey Diagram",
      font: { size: 12 },
      height: 600
    };
  }

  updateTreemapData(filteredData: any[]): void {
    // Group by classification type and name
    const energyByType: { [key: string]: { [key: string]: number } } = {};
    const typeMap: { [key: number]: string } = {};

    this.classifications.forEach(classification => {
      typeMap[classification.id] = classification.type;
    });

    filteredData.forEach(data => {
      const type = typeMap[data.classificationId] || 'Unknown';
      const name = data.classification?.name || 'Unknown';

      if (!energyByType[type]) {
        energyByType[type] = {};
      }

      if (!energyByType[type][name]) {
        energyByType[type][name] = 0;
      }

      energyByType[type][name] += data.energyValue;
    });

    // Create labels and values for treemap
    const labels: string[] = ['Total'];
    const parents: string[] = [''];
    const values: number[] = [0];
    let totalEnergy = 0;

    // Add type nodes
    Object.entries(energyByType).forEach(([type, classifications]) => {
      const typeTotal = Object.values(classifications).reduce((sum, value) => sum + value, 0);
      totalEnergy += typeTotal;

      labels.push(type);
      parents.push('Total');
      values.push(typeTotal);

      // Add classification nodes
      Object.entries(classifications).forEach(([name, value]) => {
        labels.push(`${name}`);
        parents.push(type);
        values.push(value);
      });
    });

    // Update root node value
    values[0] = totalEnergy;

    // Create treemap data
    this.treemapPlotData = [{
      type: 'treemap',
      labels: labels,
      parents: parents,
      values: values,
      textinfo: 'label+value+percent parent',
      marker: {
        colorscale: 'Viridis'
      }
    }];

    this.treemapPlotLayout = {
      title: 'Energy Consumption by Classification',
      height: 600,
      margin: { l: 0, r: 0, b: 0, t: 50 }
    };
  }

  updateHeatmapData(filteredData: any[]): void {
    // Create 2D grid for hour of day vs day of week
    const heatmapData = Array(7).fill(0).map(() => Array(24).fill(0));
    const countData = Array(7).fill(0).map(() => Array(24).fill(0));

    filteredData.forEach(data => {
      const date = new Date(data.timestamp);
      const dayOfWeek = date.getDay(); // 0-6 (Sunday-Saturday)
      const hourOfDay = date.getHours(); // 0-23

      heatmapData[dayOfWeek][hourOfDay] += data.power;
      countData[dayOfWeek][hourOfDay]++;
    });

    // Calculate averages
    const avgData = heatmapData.map((dayData, dayIndex) =>
      dayData.map((total, hourIndex) =>
        countData[dayIndex][hourIndex] > 0
          ? total / countData[dayIndex][hourIndex]
          : 0
      )
    );

    // Prepare data for plotly heatmap
    this.heatmapPlotData = [{
      z: avgData,
      x: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      y: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      type: 'heatmap',
      colorscale: 'Viridis',
      colorbar: {
        title: 'Power (kW)'
      }
    }];

    this.heatmapPlotLayout = {
      title: 'Energy Usage Pattern by Hour and Day',
      xaxis: {
        title: 'Hour of Day'
      },
      yaxis: {
        title: 'Day of Week'
      },
      height: 500
    };
  }

  // Helper method to flatten 2D heatmap data for chart.js
  flattenHeatmapData(data: number[][]): any[] {
    const flattened = [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        flattened.push({
          x: hour,
          y: days[day],
          v: data[day][hour]
        });
      }
    }

    return flattened;
  }
}
