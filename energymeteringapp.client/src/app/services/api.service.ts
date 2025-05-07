// energymeteringapp.client/src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) { }

  // Add these methods to the existing ApiService

  // Equipment
  getEquipment(): Observable<any[]> {
    return this.http.get<any[]>('/api/equipment')
      .pipe(catchError(error => this.handleError(error)));
  }

  getEquipmentById(id: number): Observable<any> {
    return this.http.get<any>(`/api/equipment/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  createEquipment(equipment: any): Observable<any> {
    return this.http.post('/api/equipment', equipment)
      .pipe(catchError(error => this.handleError(error)));
  }

  updateEquipment(id: number, equipment: any): Observable<any> {
    return this.http.put(`/api/equipment/${id}`, equipment)
      .pipe(catchError(error => this.handleError(error)));
  }

  deleteEquipment(id: number): Observable<any> {
    return this.http.delete(`/api/equipment/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  // Equipment-Classification relationships
  addClassificationToEquipment(equipmentId: number, classificationId: number): Observable<any> {
    return this.http.post(`/api/equipment/${equipmentId}/classifications/${classificationId}`, {})
      .pipe(catchError(error => this.handleError(error)));
  }

  removeClassificationFromEquipment(equipmentId: number, classificationId: number): Observable<any> {
    return this.http.delete(`/api/equipment/${equipmentId}/classifications/${classificationId}`)
      .pipe(catchError(error => this.handleError(error)));
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

  // Metering Data
  getMeteringData(params = {}): Observable<any[]> {
    return this.http.get<any[]>('/api/meteringdata', { params: new HttpParams({ fromObject: params }) })
      .pipe(catchError(error => this.handleError(error)));
  }

  generateData(params: any): Observable<any> {
    return this.http.post('/api/meteringdata/generate', params)
      .pipe(catchError(error => this.handleError(error)));
  }

  // EnPIs
  getEnPIs(): Observable<any[]> {
    return this.http.get<any[]>('/api/enpi')
      .pipe(catchError(error => this.handleError(error)));
  }

  calculateEnPI(params: any): Observable<any> {
    return this.http.post('/api/enpi/calculate', params)
      .pipe(catchError(error => this.handleError(error)));
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
    return this.http.get<any[]>('/api/enpidefinitions')
      .pipe(catchError(error => this.handleError(error)));
  }

  createEnPIDefinition(definition: any): Observable<any> {
    return this.http.post('/api/enpidefinitions', definition)
      .pipe(catchError(error => this.handleError(error)));
  }

  deleteEnPIDefinition(id: number): Observable<any> {
    return this.http.delete(`/api/enpidefinitions/${id}`)
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
