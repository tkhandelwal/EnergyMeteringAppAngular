// energymeteringapp.client/src/app/app-routing.module.ts
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

// Import new ISO 50001 components
import { Iso50001DashboardComponent } from './components/iso50001-dashboard/iso50001-dashboard.component';
import { BaselineManagerComponent } from './components/baseline-manager/baseline-manager.component';
import { TargetsManagerComponent } from './components/targets-manager/targets-manager.component';
import { ActionPlansComponent } from './components/action-plans/action-plans.component';
import { DocumentationGeneratorComponent } from './components/documentation-generator/documentation-generator.component';

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

  // ISO 50001 Routes
  { path: 'iso50001', component: Iso50001DashboardComponent },
  { path: 'baselines', component: BaselineManagerComponent },
  { path: 'targets', component: TargetsManagerComponent },
  { path: 'action-plans', component: ActionPlansComponent },
  { path: 'documentation', component: DocumentationGeneratorComponent },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
