// hierarchy-viewer.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { PlotlyModule } from 'angular-plotly.js';

@Component({
  selector: 'app-hierarchy-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, PlotlyModule],
  template: `
    <div>
      <h2>Organizational Hierarchy & Target Rollup</h2>

      <div *ngIf="error" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{error}}
        <button type="button" class="btn-close" (click)="error = null" aria-label="Close"></button>
      </div>

      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Hierarchy View</h5>
          <div *ngIf="loading" class="text-center py-5">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <div *ngIf="!loading && hierarchyData.length === 0" class="text-center py-3">
            <p>No hierarchical data available. Please define your organizational hierarchy using classifications.</p>
          </div>
          <div *ngIf="!loading && hierarchyData.length > 0" style="height: 600px; overflow: auto;">
            <div *ngFor="let org of hierarchyData" class="hierarchy-tree">
              <div class="hierarchy-node org-node" (click)="selectNode(org)">
                <span>{{org.name}} ({{org.level}})</span>
              </div>
              <div *ngIf="org.children && org.children.length > 0" class="hierarchy-children">
                <div *ngFor="let facility of org.children" class="hierarchy-tree">
                  <div class="hierarchy-node facility-node" (click)="selectNode(facility)">
                    <span>{{facility.name}} ({{facility.level}})</span>
                  </div>
                  <div *ngIf="facility.children && facility.children.length > 0" class="hierarchy-children">
                    <div *ngFor="let unit of facility.children" class="hierarchy-tree">
                      <div class="hierarchy-node unit-node" (click)="selectNode(unit)">
                        <span>{{unit.name}} ({{unit.level}})</span>
                      </div>
                      <div *ngIf="unit.children && unit.children.length > 0" class="hierarchy-children">
                        <div *ngFor="let equipment of unit.children" class="hierarchy-tree">
                          <div class="hierarchy-node equipment-node" (click)="selectNode(equipment)">
                            <span>{{equipment.name}} ({{equipment.level || 'Equipment'}})</span>
                          </div>
                        </div>
                      </div>
                      <div *ngIf="unit.equipment && unit.equipment.length > 0" class="hierarchy-children">
                        <div *ngFor="let equipment of unit.equipment" class="hierarchy-tree">
                          <div class="hierarchy-node equipment-item" (click)="selectEquipment(equipment)">
                            <span>{{equipment.name}} (Equipment)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div *ngIf="facility.equipment && facility.equipment.length > 0" class="hierarchy-children">
                    <div *ngFor="let equipment of facility.equipment" class="hierarchy-tree">
                      <div class="hierarchy-node equipment-item" (click)="selectEquipment(equipment)">
                        <span>{{equipment.name}} (Equipment)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div *ngIf="org.equipment && org.equipment.length > 0" class="hierarchy-children">
                <div *ngFor="let equipment of org.equipment" class="hierarchy-tree">
                  <div class="hierarchy-node equipment-item" (click)="selectEquipment(equipment)">
                    <span>{{equipment.name}} (Equipment)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="selectedNode" class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Target Rollup for: {{selectedNode.name}}</h5>
          <div *ngIf="loadingRollup" class="text-center py-5">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <div *ngIf="!loadingRollup && rollupData" style="height: 500px;">
            <div class="row mb-3">
              <div class="col-md-3">
                <div class="card text-center">
                  <div class="card-body">
                    <h6 class="card-title">Child Classifications</h6>
                    <h3>{{rollupData.childClassificationCount}}</h3>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card text-center">
                  <div class="card-body">
                    <h6 class="card-title">Equipment</h6>
                    <h3>{{rollupData.equipmentCount}}</h3>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card text-center">
                  <div class="card-body">
                    <h6 class="card-title">Total Targets</h6>
                    <h3>{{rollupData.totalTargetCount}}</h3>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card text-center">
                  <div class="card-body">
                    <h6 class="card-title">Avg. Reduction</h6>
                    <h3>{{getAverageReduction()}}%</h3>
                  </div>
                </div>
              </div>
            </div>
            
            <plotly-plot *ngIf="rollupChartData && rollupChartData.length > 0"
                         [data]="rollupChartData"
                         [layout]="rollupChartLayout"
                         [config]="{responsive: true}">
            </plotly-plot>
            
            <div class="table-responsive mt-3">
              <table class="table table-striped table-bordered">
                <thead>
                  <tr>
                    <th>EnPI</th>
                    <th>Classification</th>
                    <th>Target Count</th>
                    <th>Average Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of rollupData.rollupByEnPI">
                    <td>{{item.enpiName}}</td>
                    <td>{{item.classificationName}}</td>
                    <td>{{item.targetCount}}</td>
                    <td>{{item.weightedValue.toFixed(2)}}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hierarchy-tree {
      margin-left: 20px;
    }
    .hierarchy-node {
      padding: 8px;
      margin: 5px 0;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .hierarchy-node:hover {
      background-color: #f8f9fa;
    }
    .org-node {
      background-color: #cfe2ff;
      border-left: 5px solid #084298;
    }
    .facility-node {
      background-color: #d1e7dd;
      border-left: 5px solid #0f5132;
    }
    .unit-node {
      background-color: #fff3cd;
      border-left: 5px solid #664d03;
    }
    .equipment-node {
      background-color: #f8d7da;
      border-left: 5px solid #842029;
    }
    .equipment-item {
      background-color: #e2e3e5;
      border-left: 5px solid #41464b;
    }
    .hierarchy-children {
      margin-left: 20px;
    }
  `]
})
export class HierarchyViewerComponent implements OnInit {
  hierarchyData: any[] = [];
  selectedNode: any = null;
  selectedEquipment: any = null;
  rollupData: any = null;
  loading = false;
  loadingRollup = false;
  error: string | null = null;

  rollupChartData: any[] = [];
  rollupChartLayout: any = {};

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.fetchHierarchy();
  }

  fetchHierarchy(): void {
    this.loading = true;
    this.apiService.getClassificationHierarchy().subscribe({
      next: (data) => {
        this.hierarchyData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching hierarchy:', err);
        this.error = 'Failed to load hierarchy data. Please try again.';
        this.loading = false;
      }
    });
  }

  selectNode(node: any): void {
    this.selectedNode = node;
    this.selectedEquipment = null;
    this.fetchRollupData(node.id);
  }

  selectEquipment(equipment: any): void {
    this.selectedEquipment = equipment;
    this.selectedNode = null;
    // Here you could load equipment-specific data
  }

  fetchRollupData(classificationId: number): void {
    this.loadingRollup = true;
    this.apiService.getTargetRollup(classificationId).subscribe({
      next: (data) => {
        this.rollupData = data;
        this.updateRollupChart();
        this.loadingRollup = false;
      },
      error: (err) => {
        console.error('Error fetching rollup data:', err);
        this.error = 'Failed to load target rollup data. Please try again.';
        this.loadingRollup = false;
      }
    });
  }

  updateRollupChart(): void {
    if (!this.rollupData || !this.rollupData.rollupByEnPI) {
      this.rollupChartData = [];
      return;
    }

    this.rollupChartData = [{
      type: 'bar',
      x: this.rollupData.rollupByEnPI.map((item: any) => item.enpiName),
      y: this.rollupData.rollupByEnPI.map((item: any) => item.weightedValue),
      marker: {
        color: 'rgba(55, 128, 191, 0.7)'
      }
    }];

    this.rollupChartLayout = {
      title: 'Average Target Values by EnPI',
      xaxis: {
        title: 'EnPI'
      },
      yaxis: {
        title: 'Weighted Average Value (%)'
      },
      height: 300
    };
  }

  getAverageReduction(): number {
    if (!this.rollupData || !this.rollupData.rollupByEnPI || this.rollupData.rollupByEnPI.length === 0) {
      return 0;
    }

    const totalReduction = this.rollupData.rollupByEnPI.reduce(
      (sum: number, item: any) => sum + item.weightedValue, 0);
    return +(totalReduction / this.rollupData.rollupByEnPI.length).toFixed(1);
  }
}
