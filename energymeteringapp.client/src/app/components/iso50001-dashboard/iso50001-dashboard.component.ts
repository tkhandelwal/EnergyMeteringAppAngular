// energymeteringapp.client/src/app/components/iso50001-dashboard/iso50001-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlotlyModule } from 'angular-plotly.js';
import { ApiService } from '../../services/api.service';
import { ChartService } from '../../services/chart.service';
import { Router } from '@angular/router';

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

  // Continuing from where we left off
  fetchData(): void {
    this.loading = true;

    // Fetch all required data in parallel
    Promise.all([
      this.apiService.getClassifications().toPromise(),
      this.apiService.getEnPIs().toPromise(),
      this.apiService.getBaselines().toPromise(),
      this.apiService.getTargets().toPromise(),
      this.apiService.getActionPlans().toPromise()
    ]).then(([classifications, enpis, baselines, targets, actionPlans]) => {
      this.classifications = classifications || [];
      this.enpis = enpis || [];
      this.baselines = baselines || [];
      this.targets = targets || [];
      this.actionPlans = actionPlans || [];

      this.updateSummary();
      this.updateCharts();
      this.loading = false;
    }).catch(error => {
      console.error('Error fetching dashboard data:', error);
      this.error = 'Failed to load ISO 50001 dashboard data. Please try again later.';
      this.loading = false;
    });
  }

  updateSummary(): void {
    // Calculate total energy consumption
    const totalEnergy = this.enpis.reduce((sum, enpi) => {
      if (enpi.formula === 'TotalEnergy') {
        return sum + enpi.currentValue;
      }
      return sum;
    }, 0);

    // Calculate total energy savings
    const totalSavings = this.enpis.reduce((sum, enpi) => {
      if (enpi.baselineValue > 0) {
        return sum + Math.max(0, enpi.baselineValue - enpi.currentValue);
      }
      return sum;
    }, 0);

    // Calculate action plan stats
    const completedActionPlans = this.actionPlans.filter(plan => plan.status === 'Completed').length;

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
      totalEnergy: totalEnergy,
      totalSavings: totalSavings,
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
    // Filter EnPIs with baseline values for comparison
    const enpisWithBaseline = this.enpis.filter(enpi => enpi.baselineValue > 0);

    if (enpisWithBaseline.length === 0) {
      this.energySavingsChartData = [];
      return;
    }

    // Calculate savings percentage for each EnPI
    const labels = enpisWithBaseline.map(enpi => enpi.name);
    const baselineValues = enpisWithBaseline.map(enpi => enpi.baselineValue);
    const currentValues = enpisWithBaseline.map(enpi => enpi.currentValue);
    const savings = enpisWithBaseline.map(enpi =>
      ((enpi.baselineValue - enpi.currentValue) / enpi.baselineValue * 100).toFixed(1)
    );

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
        y: savings,
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
    // Mock compliance data - in a real implementation this would come from compliance assessment
    const complianceData = [
      { section: '4. Context', score: 95 },
      { section: '5. Leadership', score: 90 },
      { section: '6. Planning', score: 85 },
      { section: '7. Support', score: 80 },
      { section: '8. Operation', score: 75 },
      { section: '9. Performance Evaluation', score: 70 },
      { section: '10. Improvement', score: 65 }
    ];

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
    // Mock EnPI trend data - in a real implementation this would come from historical EnPI records
    const today = new Date();
    const mockDates = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(today.getMonth() - 5 + i);
      return date.toISOString().split('T')[0];
    });

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

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
