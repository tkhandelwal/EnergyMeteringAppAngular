// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    constructor(private http: HttpClient) { }

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
