// iso50001-dashboard.component.ts
// iso50001-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlotlyModule } from 'angular-plotly.js';
import { ApiService } from '../../services/api.service';
import { ChartService } from '../../services/chart.service';
import { Router } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface SummaryData {
  totalEnergy: number;
  totalSavings: number;
  enpiCount: number;
  actionPlansCount: number;
  completedActionPlans: number;
  complianceScore: number;
}

@Component({
  selector: 'app-iso50001-dashboard',
  templateUrl: './iso50001-dashboard.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, PlotlyModule]
})
export class Iso50001DashboardComponent implements OnInit {
  // Properly define types to avoid optional chaining warnings
  summary: SummaryData = {
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
      firstValueFrom(this.apiService.getClassifications().pipe(catchError(() => of([])))),
      firstValueFrom(this.apiService.getEnPIs().pipe(catchError(() => of([])))),
      firstValueFrom(this.apiService.getBaselines().pipe(catchError(() => of([])))),
      firstValueFrom(this.apiService.getTargets().pipe(catchError(() => of([])))),
      firstValueFrom(this.apiService.getActionPlans().pipe(catchError(() => of([]))))
    ])
      .then(([classifications, enpis, baselines, targets, actionPlans]) => {
        // Ensure we have arrays for all data
        this.classifications = Array.isArray(classifications) ? classifications : [];
        this.enpis = Array.isArray(enpis) ? enpis : [];
        this.baselines = Array.isArray(baselines) ? baselines : [];
        this.targets = Array.isArray(targets) ? targets : [];
        this.actionPlans = Array.isArray(actionPlans) ? actionPlans : [];

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
    // Filter only valid EnPIs with formula "TotalEnergy"
    const validEnpis = this.enpis.filter(enpi =>
      enpi !== null &&
      enpi !== undefined &&
      typeof enpi.formula === 'string' &&
      enpi.formula === 'TotalEnergy'
    );

    // Calculate total energy consumption from EnPIs
    const totalEnergy = validEnpis.reduce((sum, enpi) =>
      sum + (typeof enpi.currentValue === 'number' ? enpi.currentValue : 0), 0);

    // Calculate total energy savings from EnPIs that have both baseline and current values
    const totalSavings = this.enpis
      .filter(enpi =>
        enpi !== null &&
        enpi !== undefined &&
        typeof enpi.baselineValue === 'number' &&
        enpi.baselineValue > 0 &&
        typeof enpi.currentValue === 'number'
      )
      .reduce((sum, enpi) => sum + Math.max(0, enpi.baselineValue - enpi.currentValue), 0);

    // Calculate action plan stats
    const completedActionPlans = this.actionPlans
      .filter(plan => plan !== null && plan !== undefined && plan.status === 'Completed')
      .length;

    // Calculate compliance score
    // This is a simplified mock calculation, in a real implementation this would be more complex
    const hasPolicy = true; // Mock value
    const hasBaseline = this.baselines.length > 0;
    const hasEnPIs = this.enpis.length > 0;
    const hasTargets = this.targets.length > 0;
    const hasActionPlans = this.actionPlans.length > 0;

    const complianceItems = [hasPolicy, hasBaseline, hasEnPIs, hasTargets, hasActionPlans];
    const complianceScore = (complianceItems.filter(Boolean).length / complianceItems.length) * 100;

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
    const enpisWithBaseline = this.enpis.filter(enpi =>
      enpi !== null &&
      enpi !== undefined &&
      typeof enpi.baselineValue === 'number' &&
      enpi.baselineValue > 0 &&
      typeof enpi.currentValue === 'number' &&
      typeof enpi.name === 'string'
    );

    if (enpisWithBaseline.length === 0) {
      this.energySavingsChartData = [];
      return;
    }

    // Add null safety to mapping operations
    const labels = enpisWithBaseline.map(enpi => enpi.name);
    const baselineValues = enpisWithBaseline.map(enpi => enpi.baselineValue);
    const currentValues = enpisWithBaseline.map(enpi => enpi.currentValue);
    const savings = enpisWithBaseline.map(enpi => {
      const baselineValue = enpi.baselineValue || 0;
      const currentValue = enpi.currentValue || 0;
      if (baselineValue <= 0) return '0';
      return ((baselineValue - currentValue) / baselineValue * 100).toFixed(1);
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
    const completedActionPlans = this.actionPlans.filter(p =>
      p !== null &&
      p !== undefined &&
      p.status === 'Completed'
    ).length;

    complianceData[6].score = completedActionPlans > 0 ? 65 : 40;

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
    // Generate dates for the last 6 months
    const today = new Date();
    const mockDates: string[] = [];

    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(today.getMonth() - 5 + i);
      mockDates.push(date.toISOString().split('T')[0]);
    }

    // Group EnPIs by name to identify those with multiple entries
    const enpisByName: { [key: string]: any[] } = {};

    for (const enpi of this.enpis) {
      if (enpi && typeof enpi.name === 'string') {
        const name = enpi.name;
        if (!enpisByName[name]) {
          enpisByName[name] = [];
        }
        enpisByName[name].push(enpi);
      }
    }

    // If we have real data with multiple points for any EnPI, we could use it
    // For now, use mock data for demonstration

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
