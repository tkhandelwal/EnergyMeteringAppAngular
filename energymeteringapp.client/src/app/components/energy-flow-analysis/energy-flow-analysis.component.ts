import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-energy-flow-analysis',
  templateUrl: './energy-flow-analysis.component.html',
  styleUrls: ['./energy-flow-analysis.component.css']
})
export class EnergyFlowAnalysisComponent implements OnInit {
  meteringData: any[] = [];
  classifications: any[] = [];
  loading = false;
  error: string | null = null;

  dateRange = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  };

  view = 'sankey'; // 'sankey', 'treemap', or 'heatmap'

  // Data for different visualizations
  sankeyData: any = null;
  treemapData: any = null;
  heatmapData: any = null;

  constructor(private apiService: ApiService) { }

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
    // Create a mapping of classification types
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

    // This is a placeholder for Sankey diagram data
    // In a real implementation, this would be formatted for a specific Sankey library
    this.sankeyData = {
      nodes: [],
      links: []
    };

    // Add the root node
    this.sankeyData.nodes.push({ name: 'Data Center' });
    let nodeIndex = 0;

    // Process each type
    Object.keys(energyByType).forEach(type => {
      nodeIndex++;
      const typeNodeIndex = nodeIndex;
      this.sankeyData.nodes.push({ name: type });

      // Calculate total for this type
      const typeTotal = Object.values(energyByType[type])
        .reduce((sum, value) => sum + value, 0);

      // Link from root to type
      this.sankeyData.links.push({
        source: 0,
        target: typeNodeIndex,
        value: typeTotal
      });

      // Process classifications within this type
      Object.keys(energyByType[type]).forEach(name => {
        nodeIndex++;
        this.sankeyData.nodes.push({ name });

        // Link from type to classification
        this.sankeyData.links.push({
          source: typeNodeIndex,
          target: nodeIndex,
          value: energyByType[type][name]
        });
      });
    });
  }

  updateTreemapData(filteredData: any[]): void {
    // This is a placeholder for treemap data
    // In a real implementation, this would be formatted for a specific treemap library
    this.treemapData = {
      name: 'Data Center',
      children: []
    };

    // Group by classification type
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

    // Create the treemap data structure
    Object.keys(energyByType).forEach(type => {
      const typeNode = {
        name: type,
        children: []
      };

      Object.keys(energyByType[type]).forEach(name => {
        typeNode.children.push({
          name,
          value: energyByType[type][name]
        });
      });

      this.treemapData.children.push(typeNode);
    });
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

    // Prepare data for chart.js heatmap
    this.heatmapData = {
      datasets: [{
        label: 'Power (kW)',
        data: this.flattenHeatmapData(avgData),
        backgroundColor: 'rgba(0, 0, 255, 0.5)',
        borderColor: 'rgb(0, 0, 255)',
        borderWidth: 1
      }]
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
