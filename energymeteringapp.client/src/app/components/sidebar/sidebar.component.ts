// src/app/components/sidebar/sidebar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  isExpanded = true;

  menuItems = [
    {
      category: 'Dashboard',
      icon: 'bi bi-speedometer2',
      items: [
        { name: 'Overview', route: '/', icon: 'bi bi-house' }
      ]
    },
    {
      category: 'Asset Management',
      icon: 'bi bi-building-gear',
      items: [
        { name: 'Equipment', route: '/equipment', icon: 'bi bi-tools' },
        { name: 'Classifications', route: '/classifications', icon: 'bi bi-diagram-3' }
      ]
    },
    {
      category: 'Data Management',
      icon: 'bi bi-database',
      items: [
        { name: 'Energy Flow', route: '/energy-flow', icon: 'bi bi-activity' },
        { name: 'Standard Reports', route: '/reports', icon: 'bi bi-file-earmark-text' },
        { name: 'Pareto Analysis', route: '/pareto', icon: 'bi bi-bar-chart' }
      ]
    },
    {
      category: 'Performance',
      icon: 'bi bi-graph-up-arrow',
      items: [
        { name: 'EnPI Manager', route: '/enpi', icon: 'bi bi-clipboard-data' },
        { name: 'Target Management', route: '/targets', icon: 'bi bi-bullseye' },
        { name: 'Baseline Management', route: '/baselines', icon: 'bi bi-ruler' },
        { name: 'Action Plans', route: '/action-plans', icon: 'bi bi-list-check' },
        { name: 'Advanced Analysis', route: '/advanced', icon: 'bi bi-graph-up' },
        { name: 'Hierarchy & Targets', route: '/hierarchy', icon: 'bi bi-diagram-2' }
      ]
    },
    {
      category: 'ISO 50001',
      icon: 'bi bi-award',
      items: [
        { name: 'Dashboard', route: '/iso50001', icon: 'bi bi-display' },
        { name: 'Documentation', route: '/documentation', icon: 'bi bi-file-earmark-pdf' }
      ]
    },
    {
      category: 'System',
      icon: 'bi bi-gear',
      items: [
        { name: 'Data Generator', route: '/generator', icon: 'bi bi-cloud-arrow-up' },
        { name: 'System Status', route: '/system-status', icon: 'bi bi-hdd-stack' }
      ]
    }
  ];

  constructor(private sidebarService: SidebarService) { }

  ngOnInit() {
    this.sidebarService.isExpanded$.subscribe(state => {
      this.isExpanded = state;
    });
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }
}
