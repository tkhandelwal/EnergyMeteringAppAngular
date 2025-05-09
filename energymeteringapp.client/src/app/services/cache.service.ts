// src/app/services/cache.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, any>();
  private timeouts = new Map<string, number>();

  get<T>(key: string): T | null {
    if (!this.cache.has(key)) return null;
    return this.cache.get(key) as T;
  }

  set<T>(key: string, value: T, expirationMinutes = 5): void {
    this.cache.set(key, value);

    // Clear any existing timeout
    if (this.timeouts.has(key)) {
      window.clearTimeout(this.timeouts.get(key));
    }

    // Set expiration
    const timeout = window.setTimeout(() => {
      this.cache.delete(key);
      this.timeouts.delete(key);
    }, expirationMinutes * 60 * 1000);

    this.timeouts.set(key, timeout);
  }

  clear(): void {
    this.cache.clear();
    this.timeouts.forEach(timeout => window.clearTimeout(timeout));
    this.timeouts.clear();
  }

  // In cache.service.ts
  delete(key: string): void {
    if (this.timeouts.has(key)) {
      window.clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
    this.cache.delete(key);
  }

  // Helper to wrap API calls
  cachedRequest<T>(key: string, request: Observable<T>, expirationMinutes = 5): Observable<T> {
    const cachedValue = this.get<T>(key);
    if (cachedValue) {
      return of(cachedValue);
    }

    return request.pipe(
      tap(data => {
        // Only cache valid data (not null/empty arrays)
        if (data && (!Array.isArray(data) || data.length > 0)) {
          this.set(key, data, expirationMinutes);
        }
      }),
      catchError(error => {
        console.error(`Cache request error for key ${key}:`, error);
        // Don't cache errors
        return throwError(() => error);
      })
    );

  }
}
