import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-system-status',
  templateUrl: './system-status.component.html',
  styleUrls: ['./system-status.component.css']
})
export class SystemStatusComponent implements OnInit {
  statuses = {
    backend: { status: 'unknown', message: 'Not checked yet' },
    classifications: { status: 'unknown', message: 'Not checked yet' },
    meteringData: { status: 'unknown', message: 'Not checked yet' }
  };
  loading = false;
  error: string | null = null;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.checkBackend();
  }

  checkBackend(): void {
    this.loading = true;
    this.error = null;
    const result = { ...this.statuses };

    // Check API health
    this.apiService.checkHealth().subscribe({
      next: (healthCheck) => {
        result.backend = {
          status: 'ok',
          message: 'Backend API is responsive'
        };

        // After checking health, check classifications
        this.apiService.getClassifications().subscribe({
          next: (classifications) => {
            const count = Array.isArray(classifications) ? classifications.length : 0;
            result.classifications = {
              status: count > 0 ? 'ok' : 'warning',
              message: count > 0 ?
                `Found ${count} classifications` :
                'No classifications found'
            };

            // After checking classifications, check metering data
            this.apiService.getMeteringData().subscribe({
              next: (meteringData) => {
                const count = Array.isArray(meteringData) ? meteringData.length : 0;
                result.meteringData = {
                  status: 'ok',
                  message: `Found ${count} metering data points`
                };

                this.statuses = result;
                this.loading = false;
              },
              error: () => {
                result.meteringData = {
                  status: 'error',
                  message: 'Failed to fetch metering data'
                };
                this.statuses = result;
                this.loading = false;
              }
            });
          },
          error: () => {
            result.classifications = {
              status: 'error',
              message: 'Failed to fetch classifications'
            };

            // Check metering data even if classifications failed
            this.apiService.getMeteringData().subscribe({
              next: (meteringData) => {
                const count = Array.isArray(meteringData) ? meteringData.length : 0;
                result.meteringData = {
                  status: 'ok',
                  message: `Found ${count} metering data points`
                };
                this.statuses = result;
                this.loading = false;
              },
              error: () => {
                result.meteringData = {
                  status: 'error',
                  message: 'Failed to fetch metering data'
                };
                this.statuses = result;
                this.loading = false;
              }
            });
          }
        });
      },
      error: () => {
        result.backend = {
          status: 'error',
          message: 'Backend API error: Unable to connect'
        };

        // Set other statuses to error as well
        result.classifications = {
          status: 'error',
          message: 'Cannot check: Backend unavailable'
        };

        result.meteringData = {
          status: 'error',
          message: 'Cannot check: Backend unavailable'
        };

        this.statuses = result;
        this.loading = false;
        this.error = 'Failed to connect to the backend server. Please check if it\'s running.';
      }
    });
  }

  createDefaultClassifications(): void {
    this.loading = true;
    this.error = null;

    // Default classifications
    const defaults = [
      { name: "Main Building", type: "Facility", energyType: "Electricity", measurementUnit: "kWh" },
      { name: "Server Room", type: "Equipment", energyType: "Electricity", measurementUnit: "kWh" },
      { name: "Production Line A", type: "ProductionLine", energyType: "Electricity", measurementUnit: "kWh" }
    ];

    const createNext = (index = 0) => {
      if (index >= defaults.length) {
        // Refresh status after creating defaults
        this.checkBackend();
        return;
      }

      this.apiService.createClassification(defaults[index]).subscribe({
        next: () => createNext(index + 1),
        error: (err) => {
          console.error('Error creating default classifications:', err);
          this.error = 'Failed to create default classifications: ' + (err.message || 'Unknown error');
          this.loading = false;
        }
      });
    };

    createNext();
  }

  generateSampleData(): void {
    this.loading = true;
    this.error = null;

    // First check if we have classifications
    this.apiService.getClassifications().subscribe({
      next: (classifications) => {
        if (!Array.isArray(classifications) || classifications.length === 0) {
          this.error = 'Please create classifications first before generating data';
          this.loading = false;
          return;
        }

        // Generate data for each classification
        let completed = 0;
        classifications.forEach(classification => {
          const params = {
            classificationId: classification.id,
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            endDate: new Date(),
            intervalMinutes: 15,
            baseValue: 10,
            variance: 2
          };

          this.apiService.generateData(params).subscribe({
            next: () => {
              completed++;
              if (completed === classifications.length) {
                // Refresh status after generating data
                this.checkBackend();
              }
            },
            error: (err) => {
              console.error('Error generating sample data:', err);
              this.error = 'Failed to generate sample data: ' + (err.message || 'Unknown error');
              this.loading = false;
            }
          });
        });
      },
      error: (err) => {
        console.error('Error checking classifications:', err);
        this.error = 'Failed to check classifications: ' + (err.message || 'Unknown error');
        this.loading = false;
      }
    });
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'ok':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'danger';
      default:
        return 'secondary';
    }
  }
}
