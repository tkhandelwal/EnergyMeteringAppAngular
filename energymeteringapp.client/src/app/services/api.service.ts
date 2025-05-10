// api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
//import { CacheService } from './cache.service';


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Constructor injection
  constructor(private http: HttpClient) { }


  // Equipment
  getEquipment(): Observable<any[]> {
    return this.http.get<any[]>('/api/equipment')
      .pipe(catchError(error => {
        console.error('Error in getEquipment:', error);
        return throwError(() => new Error('Failed to load equipment'));
      }));
  }

  getEquipmentById(id: number): Observable<any> {
    return this.http.get<any>(`/api/equipment/${id}`)
      .pipe(catchError(error => {
        console.error('Error in getEquipmentById:', error);
        return throwError(() => new Error(`Failed to load equipment with ID ${id}`));
      }));
  }

  createEquipment(equipment: any): Observable<any> {
    console.log('Creating equipment with payload:', equipment);
    return this.http.post('/api/equipment', equipment)
      .pipe(catchError(error => {
        console.error('Error in createEquipment:', error);
        let errorMessage = 'Failed to create equipment.';
        if (error.status === 400) {
          errorMessage = `Validation error: ${error.error?.message || 'Invalid data format'}`;
        } else if (error.status === 500) {
          errorMessage = `Server error: ${error.error?.message || 'An unexpected error occurred'}`;
        }
        return throwError(() => new Error(errorMessage));
      }));
  }

  updateEquipment(id: number, equipment: any): Observable<any> {
    return this.http.put(`/api/equipment/${id}`, equipment)
      .pipe(catchError(error => {
        console.error('Error in updateEquipment:', error);
        return throwError(() => new Error(`Failed to update equipment with ID ${id}`));
      }));
  }

  deleteEquipment(id: number): Observable<any> {
    return this.http.delete(`/api/equipment/${id}`)
      .pipe(catchError(error => {
        console.error('Error in deleteEquipment:', error);
        return throwError(() => new Error(`Failed to delete equipment with ID ${id}`));
      }));
  }

  // Equipment-Classification relationships
  addClassificationToEquipment(equipmentId: number, classificationId: number): Observable<any> {
    return this.http.post(`/api/equipment/${equipmentId}/AddClassification/${classificationId}`, {})
      .pipe(catchError(error => {
        console.error('Error in addClassificationToEquipment:', error);
        return throwError(() => new Error('Failed to add classification to equipment'));
      }));
  }

  removeClassificationFromEquipment(equipmentId: number, classificationId: number): Observable<any> {
    return this.http.delete(`/api/equipment/${equipmentId}/RemoveClassification/${classificationId}`)
      .pipe(catchError(error => {
        console.error('Error in removeClassificationFromEquipment:', error);
        return throwError(() => new Error('Failed to remove classification from equipment'));
      }));
  }

  // Classifications
  getClassifications(): Observable<any[]> {
    return this.http.get<any[]>('/api/classifications')
      .pipe(catchError(error => this.handleError(error)));
  }

  createClassification(classification: any): Observable<any> {
    return this.http.post('/api/classifications', classification)
      .pipe(catchError(error => this.handleError(error)));
  }

  deleteClassification(id: number): Observable<any> {
    return this.http.delete(`/api/classifications/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  // Classification Hierarchy
  getClassificationHierarchy(): Observable<any[]> {
    return this.http.get<any[]>('/api/classifications/hierarchy')
      .pipe(catchError(error => this.handleError(error)));
  }

  createClassificationWithParent(classification: any): Observable<any> {
    return this.http.post('/api/classifications/withparent', classification)
      .pipe(catchError(error => this.handleError(error)));
  }

  // Metering Data
  getMeteringData(params = {}): Observable<any[]> {
    return this.http.get<any[]>('/api/meteringdata', {
      params: new HttpParams({ fromObject: params })
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  generateData(params: any): Observable<any> {
    // Format the data properly before sending
    const formattedParams = {
      classificationId: parseInt(params.classificationId),
      startDate: params.startDate, // Ensure this is in ISO format
      endDate: params.endDate,     // Ensure this is in ISO format
      intervalMinutes: parseInt(params.intervalMinutes),
      baseValue: parseFloat(params.baseValue),
      variance: parseFloat(params.variance)
    };

    console.log('Generating data with params:', formattedParams);
    return this.http.post('/api/meteringdata/generate', formattedParams)
      .pipe(catchError(error => {
        console.error('Error in generateData:', error);
        const errorMessage = error.error?.message || 'Failed to generate data';
        return throwError(() => new Error(errorMessage));
      }));
  }

  generateEquipmentData(params: any): Observable<any> {
    // Format the data properly before sending
    const formattedParams = {
      equipmentId: parseInt(params.equipmentId),
      startDate: params.startDate,
      endDate: params.endDate,
      intervalMinutes: parseInt(params.intervalMinutes),
      baseValue: parseFloat(params.baseValue),
      variance: parseFloat(params.variance)
    };

    console.log('Generating equipment data with params:', formattedParams);
    return this.http.post('/api/meteringdata/generate', formattedParams)
      .pipe(catchError(error => {
        console.error('Error in generateEquipmentData:', error);
        const errorMessage = error.error?.message || 'Failed to generate data';
        return throwError(() => new Error(errorMessage));
      }));
  }

  // EnPIs
  getEnPIs(): Observable<any[]> {
    return this.http.get<any[]>('/api/enpi')
      .pipe(
        catchError(error => {
          console.error('Error fetching EnPIs:', error);
          return of([]); // Return empty array on error
        })
      );
  }

  calculateEnPI(params: any): Observable<any> {
    return this.http.post('/api/enpi/calculate', params)
      .pipe(
        catchError(error => {
          console.error('Error calculating EnPI:', error);
          const errorMessage = error.error?.message || 'Failed to calculate EnPI';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  deleteEnPI(id: number): Observable<any> {
    return this.http.delete(`/api/enpi/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  // System Status
  checkHealth(): Observable<any> {
    return this.http.get('/api/health')
      .pipe(catchError(error => this.handleError(error)));
  }

  // ISO 50001 Baselines
  getBaselines(): Observable<any[]> {
    return this.http.get<any[]>('/api/baselines')
      .pipe(catchError(error => this.handleError(error)));
  }

  createBaseline(baseline: any): Observable<any> {
    return this.http.post('/api/baselines', baseline)
      .pipe(catchError(error => this.handleError(error)));
  }

  deleteBaseline(id: number): Observable<any> {
    return this.http.delete(`/api/baselines/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  // ISO 50001 EnPI Definitions
  getEnPIDefinitions(): Observable<any[]> {
    console.log('Fetching EnPI definitions');
    return this.http.get<any[]>('/api/EnPIDefinitions').pipe(
      catchError(error => {
        console.error('Error in getEnPIDefinitions:', error);
        return throwError(() => new Error('Failed to load EnPI definitions'));
      })
    );
  }

  createEnPIDefinition(definition: any): Observable<any> {
    return this.http.post('/api/EnPIDefinitions', definition)
      .pipe(catchError(error => this.handleError(error)));
  }

  deleteEnPIDefinition(id: number): Observable<any> {
    return this.http.delete(`/api/EnPIDefinitions/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  // ISO 50001 Targets
  getTargets(): Observable<any[]> {
    return this.http.get<any[]>('/api/targets')
      .pipe(catchError(error => this.handleError(error)));
  }

  createTarget(target: any): Observable<any> {
    return this.http.post('/api/targets', target)
      .pipe(catchError(error => this.handleError(error)));
  }

  deleteTarget(id: number): Observable<any> {
    return this.http.delete(`/api/targets/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  // Equipment Targets
  // api.service.ts
  getEquipmentTargets(equipmentId: number): Observable<any[]> {
    if (!equipmentId) {
      console.error('Invalid equipment ID provided to getEquipmentTargets');
      return of([]);
    }

    console.log(`Fetching targets for equipment ID ${equipmentId}`);
    return this.http.get<any[]>(`/api/targets/equipment/${equipmentId}`).pipe(
      catchError(error => {
        console.error(`Error fetching targets for equipment ID ${equipmentId}:`, error);
        return of([]); // Return empty array on error instead of throwing
      })
    );
  }

  createEquipmentTarget(target: any): Observable<any> {
    return this.http.post('/api/targets/equipment', target)
      .pipe(catchError(error => this.handleError(error)));
  }

  // Target Rollup
  getTargetRollup(classificationId: number): Observable<any> {
    return this.http.get<any>(`/api/targets/rollup/${classificationId}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  // ISO 50001 Action Plans
  getActionPlans(): Observable<any[]> {
    return this.http.get<any[]>('/api/actionplans')
      .pipe(catchError(error => this.handleError(error)));
  }

  createActionPlan(actionPlan: any): Observable<any> {
    return this.http.post('/api/actionplans', actionPlan)
      .pipe(catchError(error => this.handleError(error)));
  }

  updateActionPlan(id: number, actionPlan: any): Observable<any> {
    return this.http.put(`/api/actionplans/${id}`, actionPlan)
      .pipe(catchError(error => this.handleError(error)));
  }

  deleteActionPlan(id: number): Observable<any> {
    return this.http.delete(`/api/actionplans/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  // ISO 50001 Documentation
  generateDocument(request: any): Observable<any> {
    return this.http.post('/api/documentation/generate', request)
      .pipe(catchError(error => this.handleError(error)));
  }

  generateWordReport(request: any): Observable<any> {
    return this.http.post('/api/reports/word', request)
      .pipe(catchError(error => this.handleError(error)));
  }

  // Error handling
  private handleError(error: any) {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
