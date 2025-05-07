import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) { }

  // Classifications
  getClassifications(): Observable<any[]> {
    return this.http.get<any[]>('/api/classifications');
  }

  createClassification(classification: any): Observable<any> {
    return this.http.post('/api/classifications', classification);
  }

  deleteClassification(id: number): Observable<any> {
    return this.http.delete(`/api/classifications/${id}`);
  }

  // Metering Data
  getMeteringData(params = {}): Observable<any[]> {
    return this.http.get<any[]>('/api/meteringdata', { params: new HttpParams({ fromObject: params }) });
  }

  generateData(params: any): Observable<any> {
    return this.http.post('/api/meteringdata/generate', params);
  }

  // EnPIs
  getEnPIs(): Observable<any[]> {
    return this.http.get<any[]>('/api/enpi');
  }

  calculateEnPI(params: any): Observable<any> {
    return this.http.post('/api/enpi/calculate', params);
  }

  deleteEnPI(id: number): Observable<any> {
    return this.http.delete(`/api/enpi/${id}`);
  }

  // System Status
  checkHealth(): Observable<any> {
    return this.http.get('/api/health');
  }

  // Baseline operations
  getBaselines(): Observable<any[]> {
    return this.http.get<any[]>('/api/baselines');
  }

  createBaseline(baseline: any): Observable<any> {
    return this.http.post('/api/baselines', baseline);
  }

  // EnPI Definitions
  getEnPIDefinitions(): Observable<any[]> {
    return this.http.get<any[]>('/api/enpidefinitions');
  }

  createEnPIDefinition(definition: any): Observable<any> {
    return this.http.post('/api/enpidefinitions', definition);
  }

  // Targets
  getTargets(): Observable<any[]> {
    return this.http.get<any[]>('/api/targets');
  }

  createTarget(target: any): Observable<any> {
    return this.http.post('/api/targets', target);
  }
}
