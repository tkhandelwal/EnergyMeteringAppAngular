// src/app/services/sidebar.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private isExpandedSubject = new BehaviorSubject<boolean>(true);
  isExpanded$ = this.isExpandedSubject.asObservable();

  constructor() {
    // Check for saved state in localStorage
    const savedState = localStorage.getItem('sidebar-expanded');
    if (savedState) {
      this.isExpandedSubject.next(savedState === 'true');
    }
  }

  toggle() {
    const newState = !this.isExpandedSubject.value;
    this.isExpandedSubject.next(newState);
    localStorage.setItem('sidebar-expanded', newState.toString());
  }

  expand() {
    this.isExpandedSubject.next(true);
    localStorage.setItem('sidebar-expanded', 'true');
  }

  collapse() {
    this.isExpandedSubject.next(false);
    localStorage.setItem('sidebar-expanded', 'false');
  }
}
