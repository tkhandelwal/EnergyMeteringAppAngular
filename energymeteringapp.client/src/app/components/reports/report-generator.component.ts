import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";

// src/app/components/reports/report-generator.component.ts
@Component({
  selector: 'app-report-generator',
  template: `
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">Generate Professional Report</h5>
        
        <form (ngSubmit)="generateReport()">
          <div class="row mb-3">
            <div class="col-md-8">
              <label for="title" class="form-label">Report Title</label>
              <input type="text" 
                    class="form-control" 
                    id="title" 
                    name="title"
                    [(ngModel)]="reportConfig.title" 
                    required>
            </div>
            <div class="col-md-4">
              <label for="preparedBy" class="form-label">Prepared By</label>
              <input type="text" 
                    class="form-control" 
                    id="preparedBy" 
                    name="preparedBy"
                    [(ngModel)]="reportConfig.preparedBy">
            </div>
          </div>
          
          <div class="row mb-3">
            <div class="col-md-4">
              <label for="startDate" class="form-label">Start Date</label>
              <input type="date"
                    class="form-control"
                    id="startDate"
                    name="startDate"
                    [(ngModel)]="reportConfig.startDate"
                    required>
            </div>
            <div class="col-md-4">
              <label for="endDate" class="form-label">End Date</label>
              <input type="date"
                    class="form-control"
                    id="endDate"
                    name="endDate"
                    [(ngModel)]="reportConfig.endDate"
                    required>
            </div>
            <div class="col-md-4">
              <label for="classificationId" class="form-label">Classification</label>
              <select class="form-select"
                    id="classificationId"
                    name="classificationId"
                    [(ngModel)]="reportConfig.classificationId"
                    required>
                <option *ngFor="let classification of classifications" [value]="classification.id">
                  {{classification.name}} ({{classification.type}})
                </option>
              </select>
            </div>
          </div>
          
          <div class="row mb-3">
            <div class="col-md-6">
              <label for="companyName" class="form-label">Company Name</label>
              <input type="text"
                    class="form-control"
                    id="companyName"
                    name="companyName"
                    [(ngModel)]="reportConfig.companyName">
            </div>
          </div>
          
          <div class="row mb-3">
            <div class="col-md-4">
              <div class="form-check">
                <input class="form-check-input"
                      type="checkbox"
                      id="includeCharts"
                      name="includeCharts"
                      [(ngModel)]="reportConfig.includeCharts">
                <label class="form-check-label" for="includeCharts">
                  Include Charts
                </label>
              </div>
            </div>
            
            <div class="col-md-4">
              <div class="form-check">
                <input class="form-check-input"
                      type="checkbox"
                      id="includeEnPI"
                      name="includeEnPI"
                      [(ngModel)]="reportConfig.includeEnPI">
                <label class="form-check-label" for="includeEnPI">
                  Include EnPI Analysis
                </label>
              </div>
            </div>
            
            <div class="col-md-4">
              <div class="form-check">
                <input class="form-check-input"
                      type="checkbox"
                      id="includeRawData"
                      name="includeRawData"
                      [(ngModel)]="reportConfig.includeRawData">
                <label class="form-check-label" for="includeRawData">
                  Include Raw Data
                </label>
              </div>
            </div>
          </div>
          
          <button type="submit" class="btn btn-primary" [disabled]="loading">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            {{loading ? 'Generating...' : 'Generate Report'}}
          </button>
        </form>
      </div>
    </div>
    
    <div *ngIf="reportUrl" class="card mt-3">
      <div class="card-body">
        <h5 class="card-title">Report Ready</h5>
        <p>Your report has been generated successfully!</p>
        <a [href]="reportUrl" class="btn btn-success" download>
          <i class="bi bi-file-earmark-word"></i> Download Report
        </a>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ReportGeneratorComponent implements OnInit {
  reportConfig = {
    title: 'Energy Consumption Report',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    classificationId: '',
    companyName: 'Your Company',
    preparedBy: '',
    includeCharts: true,
    includeEnPI: true,
    includeRawData: false
  };

  classifications: any[] = [];
  loading = false;
  reportUrl: string | null = null;

  constructor(
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.loadClassifications();
    // Pre-populate preparedBy with user info if available
    this.reportConfig.preparedBy = 'System Administrator';
  }

  loadClassifications(): void {
    this.apiService.getClassifications().subscribe({
      next: (data) => {
        this.classifications = data;
        if (this.classifications.length > 0) {
          this.reportConfig.classificationId = this.classifications[0].id;
        }
      },
      error: (err) => console.error('Error loading classifications:', err)
    });
  }

  generateReport(): void {
    this.loading = true;
    this.reportUrl = null;

    this.apiService.generateWordReport(this.reportConfig).subscribe({
      next: (response) => {
        this.reportUrl = response.path;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error generating report:', err);
        this.loading = false;
        // Handle error notification
      }
    });
  }
}
