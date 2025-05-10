// src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { SidebarService } from './services/sidebar.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent]
})
export class AppComponent {
  isExpanded = true;
  isDarkTheme = false;

  constructor(
    private sidebarService: SidebarService,
    private themeService: ThemeService
  ) {
    this.sidebarService.isExpanded$.subscribe(state => {
      this.isExpanded = state;
    });

    this.themeService.isDarkTheme$.subscribe(isDark => {
      this.isDarkTheme = isDark;
    });
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
