import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ClassificationManagerComponent } from './components/classification-manager/classification-manager.component';
import { DataGeneratorComponent } from './components/data-generator/data-generator.component';
import { EnPIManagerComponent } from './components/enpi-manager/enpi-manager.component';
import { ReportsComponent } from './components/reports/reports.component';
import { SystemStatusComponent } from './components/system-status/system-status.component';
import { EnergyFlowAnalysisComponent } from './components/energy-flow-analysis/energy-flow-analysis.component';
import { ParetoAnalysisComponent } from './components/pareto-analysis/pareto-analysis.component';
import { AdvancedAnalysisComponent } from './components/advanced-analysis/advanced-analysis.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'classifications', component: ClassificationManagerComponent },
  { path: 'generator', component: DataGeneratorComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'enpi', component: EnPIManagerComponent },
  { path: 'energy-flow', component: EnergyFlowAnalysisComponent },
  { path: 'pareto', component: ParetoAnalysisComponent },
  { path: 'advanced', component: AdvancedAnalysisComponent },
  { path: 'system-status', component: SystemStatusComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
