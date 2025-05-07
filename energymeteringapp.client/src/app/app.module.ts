import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PlotlyModule } from 'angular-plotly.js';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ClassificationManagerComponent } from './components/classification-manager/classification-manager.component';
import { DataGeneratorComponent } from './components/data-generator/data-generator.component';
import { EnPIManagerComponent } from './components/enpi-manager/enpi-manager.component';
import { ReportsComponent } from './components/reports/reports.component';
import { SystemStatusComponent } from './components/system-status/system-status.component';
import { EnergyFlowAnalysisComponent } from './components/energy-flow-analysis/energy-flow-analysis.component';
import { ParetoAnalysisComponent } from './components/pareto-analysis/pareto-analysis.component';
import { AdvancedAnalysisComponent } from './components/advanced-analysis/advanced-analysis.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    ClassificationManagerComponent,
    DataGeneratorComponent,
    EnPIManagerComponent,
    ReportsComponent,
    SystemStatusComponent,
    EnergyFlowAnalysisComponent,
    ParetoAnalysisComponent,
    AdvancedAnalysisComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    PlotlyModule,
    AppRoutingModule
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
