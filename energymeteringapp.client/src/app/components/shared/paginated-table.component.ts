import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";

// src/app/components/shared/paginated-table.component.ts
@Component({
  selector: 'app-paginated-table',
  template: `
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th *ngFor="let column of columns">{{column.title}}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of data">
            <td *ngFor="let column of columns">
              {{getColumnValue(item, column)}}
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="d-flex justify-content-between align-items-center">
        <div>
          Showing {{(currentPage-1)*pageSize + 1}} to {{Math.min(currentPage*pageSize, totalItems)}} of {{totalItems}} entries
        </div>
        <div>
          <button class="btn btn-sm btn-outline-primary me-1" 
                 [disabled]="currentPage === 1"
                 (click)="changePage(currentPage - 1)">Previous</button>
          <button *ngFor="let page of getVisiblePages()" 
                 class="btn btn-sm me-1" 
                 [class.btn-primary]="page === currentPage"
                 [class.btn-outline-primary]="page !== currentPage"
                 (click)="changePage(page)">{{page}}</button>
          <button class="btn btn-sm btn-outline-primary" 
                 [disabled]="currentPage === totalPages"
                 (click)="changePage(currentPage + 1)">Next</button>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule]
})
export class PaginatedTableComponent implements OnInit {
  @Input() columns: { key: string, title: string, formatter?: (value: any) => string }[] = [];
  @Input() data: any[] = [];
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() currentPage = 1;
  @Input() totalPages = 1;

  @Output() pageChange = new EventEmitter<number>();

  Math = Math;

  ngOnInit() {
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
  }

  getColumnValue(item: any, column: any): any {
    const value = item[column.key];
    return column.formatter ? column.formatter(value) : value;
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.pageChange.emit(page);
  }

  getVisiblePages(): number[] {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
}
