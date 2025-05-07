// src/app/services/chart.service.ts
import { Injectable } from '@angular/core';
import { Layout, Data } from 'plotly.js';

@Injectable({
  providedIn: 'root'
})
export class ChartService {
  constructor() { }

  getDefaultLayout(title: string, height = 400): Partial<Layout> {
    return {
      title: title,
      height: height,
      margin: { l: 50, r: 50, b: 50, t: 50, pad: 4 },
      autosize: true
    };
  }

  getLineChartLayout(title: string, xAxis = 'Time', yAxis = 'Value', height = 400): Partial<Layout> {
    return {
      ...this.getDefaultLayout(title, height),
      xaxis: {
        title: xAxis,
        showgrid: true,
        zeroline: false
      },
      yaxis: {
        title: yAxis,
        showgrid: true,
        zeroline: false
      }
    };
  }

  getBarChartLayout(title: string, xAxis = 'Category', yAxis = 'Value', height = 400): Partial<Layout> {
    return {
      ...this.getDefaultLayout(title, height),
      xaxis: {
        title: xAxis,
        showgrid: false,
        zeroline: false
      },
      yaxis: {
        title: yAxis,
        showgrid: true,
        zeroline: false
      }
    };
  }

  getParetoChartLayout(title: string, height = 400): Partial<Layout> {
    return {
      ...this.getDefaultLayout(title, height),
      xaxis: {
        title: 'Category',
        showgrid: false,
        zeroline: false
      },
      yaxis: {
        title: 'Value',
        showgrid: true,
        zeroline: false
      },
      yaxis2: {
        title: 'Cumulative %',
        titlefont: { color: 'rgb(255, 99, 132)' },
        tickfont: { color: 'rgb(255, 99, 132)' },
        overlaying: 'y',
        side: 'right',
        range: [0, 100],
        ticksuffix: '%'
      }
    };
  }

  getHeatmapLayout(title: string, height = 400): Partial<Layout> {
    return {
      ...this.getDefaultLayout(title, height),
      xaxis: {
        title: 'Hour of Day',
        tickvals: Array.from({ length: 24 }, (_, i) => i)
      },
      yaxis: {
        title: 'Day of Week'
      }
    };
  }

  getSankeyLayout(title: string, height = 600): Partial<Layout> {
    return {
      ...this.getDefaultLayout(title, height),
      font: {
        size: 12
      }
    };
  }

  // Color scales and helpers
  getColorScale(count: number): string[] {
    const colors = [
      'rgba(66, 133, 244, 0.7)',
      'rgba(219, 68, 55, 0.7)',
      'rgba(244, 180, 0, 0.7)',
      'rgba(15, 157, 88, 0.7)',
      'rgba(171, 71, 188, 0.7)',
      'rgba(0, 172, 193, 0.7)'
    ];

    if (count <= colors.length) {
      return colors.slice(0, count);
    } else {
      const result = [...colors];
      for (let i = colors.length; i < count; i++) {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        result.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
      }
      return result;
    }
  }
}
