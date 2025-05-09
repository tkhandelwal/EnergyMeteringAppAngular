// iso50001-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlotlyModule } from 'angular-plotly.js';
import { ApiService } from '../../services/api.service';
import { ChartService } from '../../services/chart.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-iso50001-dashboard',
  templateUrl: './iso50001-dashboard.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, PlotlyModule]
})
export class Iso50001DashboardComponent implements OnInit {
  summary = {
    totalEnergy: 0,
    totalSavings: 0,
    enpiCount: 0,
    actionPlansCount: 0,
    completedActionPlans: 0,
    complianceScore: 0
  };

  baselines: any[] = [];
  targets: any[] = [];
  actionPlans: any[] = [];
  classifications: any[] = [];
  enpis: any[] = [];

  loading = false;
  error: string | null = null;

  // Charts
  energySavingsChartData: any[] = [];
  energySavingsChartLayout: any = {};

  complianceChartData: any[] = [];
  complianceChartLayout: any = {};

  enpiTrendChartData: any[] = [];
  enpiTrendChartLayout: any = {};

  constructor(
    private apiService: ApiService,
    private chartService: ChartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.loading = true;
    this.error = null;

    // Use Promise.all to fetch all required data in parallel
    Promise.all([
      firstValueFrom(this.apiService.getClassifications().catch(() => [])),
      firstValueFrom(this.apiService.getEnPIs().catch(() => [])),
      firstValueFrom(this.apiService.getBaselines().catch(() => [])),
      firstValueFrom(this.apiService.getTargets().catch(() => [])),
      firstValueFrom(this.apiService.getActionPlans().catch(() => []))
    ])
      .then(([classifications, enpis, baselines, targets, actionPlans]) => {
        this.classifications = classifications || [];
        this.enpis = enpis || [];
        this.baselines = baselines || [];
        this.targets = targets || [];
        this.actionPlans = actionPlans || [];

        this.updateSummary();
        this.updateCharts();
      })
      .catch(error => {
        console.error('Error fetching dashboard data:', error);
        this.error = 'Failed to load ISO 50001 dashboard data. Please try again later.';
      })
      .finally(() => {
        this.loading = false;
      });
  }

  updateSummary(): void {
    // Calculate total energy consumption from EnPIs
    const totalEnergy = this.enpis
      .filter(enpi => enpi && enpi.formula === 'TotalEnergy')
      .reduce((sum, enpi) => sum + (enpi.currentValue || 0), 0);

    // Calculate total energy savings
    const totalSavings = this.enpis
      .filter(enpi => enpi && typeof enpi.baselineValue === 'number' && enpi.baselineValue > 0)
      .reduce((sum, enpi) => sum + Math.max(0, (enpi.baselineValue || 0) - (enpi.currentValue || 0)), 0);

    // Calculate action plan stats
    const completedActionPlans = this.actionPlans
      .filter(plan => plan && plan.status === 'Completed')
      .length;

    // Calculate compliance score
    // This is a simplified mock calculation, in a real implementation this would be more complex
    const hasPolicy = true; // Mock value
    const hasBaseline = this.baselines.length > 0;
    const hasEnPIs = this.enpis.length > 0;
    const hasTargets = this.targets.length > 0;
    const hasActionPlans = this.actionPlans.length > 0;

    const complianceItems = [hasPolicy, hasBaseline, hasEnPIs, hasTargets, hasActionPlans];
    const complianceScore = complianceItems.filter(Boolean).length / complianceItems.length * 100;

    this.summary = {
      totalEnergy: totalEnergy || 0,
      totalSavings: totalSavings || 0,
      enpiCount: this.enpis.length,
      actionPlansCount: this.actionPlans.length,
      completedActionPlans: completedActionPlans,
      complianceScore: complianceScore
    };
  }

  updateCharts(): void {
    this.updateEnergySavingsChart();
    this.updateComplianceChart();
    this.updateEnPITrendChart();
  }

  updateEnergySavingsChart(): void {
    // Filter EnPIs with baseline values for comparison, with null safety checks
    const enpisWithBaseline = this.enpis
      .filter(enpi => enpi &&
        typeof enpi.baselineValue === 'number' &&
        enpi.baselineValue > 0 &&
        typeof enpi.currentValue === 'number');

    if (!enpisWithBaseline || enpisWithBaseline.length === 0) {
      this.energySavingsChartData = [];
      return;
    }

    // Add null safety to mapping operations
    const labels = enpisWithBaseline.map(enpi => enpi.name || 'Unknown');
    const baselineValues = enpisWithBaseline.map(enpi => enpi.baselineValue || 0);
    const currentValues = enpisWithBaseline.map(enpi => enpi.currentValue || 0);
    const savings = enpisWithBaseline.map(enpi => {
      if (!enpi.baselineValue) return '0';
      return ((enpi.baselineValue - (enpi.currentValue || 0)) / enpi.baselineValue * 100).toFixed(1);
    });

    // Create chart data
    this.energySavingsChartData = [
      {
        x: labels,
        y: baselineValues,
        type: 'bar',
        name: 'Baseline',
        marker: { color: 'rgba(55, 128, 191, 0.7)' }
      },
      {
        x: labels,
        y: currentValues,
        type: 'bar',
        name: 'Current',
        marker: { color: 'rgba(219, 64, 82, 0.7)' }
      },
      {
        x: labels,
        y: savings.map(s => parseFloat(s)),
        type: 'scatter',
        mode: 'text+markers',
        text: savings.map(value => value + '%'),
        textposition: 'top center',
        name: 'Savings %',
        yaxis: 'y2',
        marker: { size: 8, color: 'rgba(50, 171, 96, 0.7)' }
      }
    ];

    this.energySavingsChartLayout = {
      title: 'EnPI Performance: Baseline vs. Current',
      barmode: 'group',
      xaxis: {
        title: 'EnPI',
        tickangle: -45
      },
      yaxis: {
        title: 'Value'
      },
      yaxis2: {
        title: 'Savings %',
        titlefont: { color: 'rgb(50, 171, 96)' },
        tickfont: { color: 'rgb(50, 171, 96)' },
        overlaying: 'y',
        side: 'right',
        showgrid: false,
        range: [0, 100]
      },
      height: 400,
      legend: {
        orientation: 'h',
        y: -0.2
      }
    };
  }

  updateComplianceChart(): void {
    // Mock compliance data or calculate based on actual implementation status
    const complianceData = [
      { section: '4. Context', score: 0 },
      { section: '5. Leadership', score: 0 },
      { section: '6. Planning', score: 0 },
      { section: '7. Support', score: 0 },
      { section: '8. Operation', score: 0 },
      { section: '9. Performance Evaluation', score: 0 },
      { section: '10. Improvement', score: 0 }
    ];

    // Update scores based on actual implementation
    complianceData[0].score = 95; // Context always implemented
    complianceData[1].score = 90; // Leadership

    // Planning score depends on baselines, EnPIs, and targets
    complianceData[2].score = 65;
    if (this.baselines.length > 0) complianceData[2].score += 10;
    if (this.enpis.length > 0) complianceData[2].score += 10;
    if (this.targets.length > 0) complianceData[2].score += 10;

    // Support score
    complianceData[3].score = 80;

    // Operation score depends on action plans
    complianceData[4].score = this.actionPlans.length > 0 ? 75 : 55;

    // Performance Evaluation score
    complianceData[5].score = 70;

    // Improvement score depends on completed action plans
    complianceData[6].score = this.actionPlans.filter(p => p && p.status === 'Completed').length > 0 ? 65 : 40;

    this.complianceChartData = [{
      type: 'scatterpolar',
      r: complianceData.map(item => item.score),
      theta: complianceData.map(item => item.section),
      fill: 'toself',
      name: 'ISO 50001 Compliance',
      marker: { color: 'rgba(55, 128, 191, 0.7)' }
    }];

    this.complianceChartLayout = {
      title: 'ISO 50001 Compliance Assessment',
      polar: {
        radialaxis: {
          visible: true,
          range: [0, 100]
        }
      },
      height: 400
    };
  }

  updateEnPITrendChart(): void {
    // If we have real EnPI data, we could try to show trends
    // For now, we'll just use mock data
    const today = new Date();
    const mockDates: string[] = [];

    // Generate dates for the last 6 months
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(today.getMonth() - 5 + i);
      mockDates.push(date.toISOString().split('T')[0]);
    }

    // Check if we have enough real EnPI data to show trends
    const enpisByName = this.enpis
      .filter(enpi => enpi && enpi.name)
      .reduce((acc: { [key: string]: any[] }, enpi) => {
        const name = enpi.name || 'Unknown';
        if (!acc[name]) acc[name] = [];
        acc[name].push(enpi);
        return acc;
      }, {});

    // If we have real data with multiple points for any EnPI, use it
    // otherwise use mock data
    if (Object.values(enpisByName).some(enpis => enpis.length > 1)) {
      // Real data processing would go here
      // For now, still using mocks
    }

    // Mock data for 3 EnPIs
    const mockEnPI1 = [15.2, 14.8, 14.5, 14.3, 14.0, 13.8];
    const mockEnPI2 = [3.8, 3.7, 3.5, 3.4, 3.3, 3.2];
    const mockEnPI3 = [550, 540, 530, 525, 520, 515];

    this.enpiTrendChartData = [
      {
        x: mockDates,
        y: mockEnPI1,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Energy Intensity (kWh/ft²)',
        marker: { size: 8 }
      },
      {
        x: mockDates,
        y: mockEnPI2,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Energy per Unit (kWh/unit)',
        marker: { size: 8 }
      },
      {
        x: mockDates,
        y: mockEnPI3,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Peak Demand (kW)',
        yaxis: 'y2',
        marker: { size: 8 }
      }
    ];

    this.enpiTrendChartLayout = {
      title: 'EnPI Trends',
      xaxis: {
        title: 'Month'
      },
      yaxis: {
        title: 'Value'
      },
      yaxis2: {
        title: 'Peak Demand (kW)',
        titlefont: { color: 'rgb(255, 99, 132)' },
        tickfont: { color: 'rgb(255, 99, 132)' },
        overlaying: 'y',
        side: 'right'
      },
      height: 400,
      legend: {
        orientation: 'h',
        y: -0.2
      }
    };
  }

  // Navigate to other ISO 50001 pages
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
