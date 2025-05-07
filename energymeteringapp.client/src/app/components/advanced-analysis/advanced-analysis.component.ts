import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-advanced-analysis',
  templateUrl: './advanced-analysis.component.html',
  styleUrls: ['./advanced-analysis.component.css']
})
export class AdvancedAnalysisComponent implements OnInit {
  meteringData: any[] = [];
  classifications: any[] = [];
  loading = false;
  error: string | null = null;

  analysisConfig = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // today
    classificationIds: [],
    viewType: 'hourlyHeatmap',
    comparisonType: 'none'
  };

  analysisData: any = null;
  chartOptions: any = {};

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.loading = true;
    this.error = null;

    // Fetch classifications and metering data in parallel
    Promise.all([
      this.apiService.getClassifications().toPromise(),
      this.apiService.getMeteringData().toPromise()
    ]).then(([classifications, meteringData]) => {
      this.classifications = classifications || [];
      this.meteringData = meteringData || [];
      this.performAnalysis();
    }).catch(error => {
      console.error('Error fetching data:', error);
      this.error = 'Failed to load data. Please try again later.';
    }).finally(() => {
      this.loading = false;
    });
  }

  handleConfigChange(event: any): void {
    const { name, value, type } = event.target;

    if (name === 'classificationIds' && type === 'select-multiple') {
      const options = event.target.options;
      const selectedValues = [];
      for (let i = 0; i < options.length; i++) {
        if (options[i].selected) {
          selectedValues.push(parseInt(options[i].value));
        }
      }

      this.analysisConfig = {
        ...this.analysisConfig,
        classificationIds: selectedValues
      };
    } else {
      this.analysisConfig = {
        ...this.analysisConfig,
        [name]: value
      };
    }

    this.performAnalysis();
  }

  performAnalysis(): void {
    // Filter data based on dates and classifications
    const filteredData = this.getFilteredData();

    if (filteredData.length === 0) {
      this.analysisData = null;
      return;
    }

    // Perform different analyses based on viewType
    switch (this.analysisConfig.viewType) {
      case 'hourlyHeatmap':
        this.generateHourlyHeatmap(filteredData);
        break;
      case 'weekdayComparison':
        this.generateWeekdayComparison(filteredData);
        break;
      case 'consumptionTrend':
        this.generateConsumptionTrend(filteredData);
        break;
      case 'classificationComparison':
        this.generateClassificationComparison(filteredData);
        break;
      default:
        this.analysisData = null;
    }
  }

  getFilteredData(): any[] {
    let filteredData = [...this.meteringData];

    // Filter by dates
    filteredData = filteredData.filter(data =>
      new Date(data.timestamp) >= new Date(this.analysisConfig.startDate) &&
      new Date(data.timestamp) <= new Date(this.analysisConfig.endDate)
    );

    // Filter by classifications if selected
    if (this.analysisConfig.classificationIds.length > 0) {
      filteredData = filteredData.filter(data =>
        this.analysisConfig.classificationIds.includes(data.classificationId)
      );
    }

    return filteredData;
  }

  generateHourlyHeatmap(filteredData: any[]): void {
    // Create 2D grid for day of week vs hour of day
    const heatmapData = Array(7).fill(0).map(() => Array(24).fill(0));
    const countData = Array(7).fill(0).map(() => Array(24).fill(0));

    filteredData.forEach(item => {
      const date = new Date(item.timestamp);
      const dayOfWeek = date.getDay(); // 0-6
      const hourOfDay = date.getHours(); // 0-23

      heatmapData[dayOfWeek][hourOfDay] += item.power;
      countData[dayOfWeek][hourOfDay]++;
    });

    // Calculate averages
    const avgData = heatmapData.map((day, dayIndex) =>
      day.map((total, hourIndex) =>
        countData[dayIndex][hourIndex] > 0
          ? total / countData[dayIndex][hourIndex]
          : 0
      )
    );

    // Flatten data for chart.js
    const flattenedData = [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        flattenedData.push({
          x: hour,
          y: days[day],
          v: avgData[day][hour]
        });
      }
    }

    this.analysisData = {
      datasets: [{
        label: 'Power (kW)',
        data: flattenedData,
        backgroundColor: function (context: any) {
          const value = context.dataset.data[context.dataIndex].v;
          const alpha = value / Math.max(...flattenedData.map(d => d.v));
          return `rgba(66, 133, 244, ${alpha})`;
        }
      }]
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              return `Power: ${context.dataset.data[context.dataIndex].v.toFixed(2)} kW`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          min: 0,
          max: 23,
          ticks: {
            stepSize: 1,
            callback: function (value: number) {
              return `${value}:00`;
            }
          },
          title: {
            display: true,
            text: 'Hour of Day'
          }
        },
        y: {
          type: 'category',
          position: 'left',
          labels: days,
          title: {
            display: true,
            text: 'Day of Week'
          }
        }
      }
    };
  }

  generateWeekdayComparison(filteredData: any[]): void {
    // Group data by day of week
    const weekdayData = Array(7).fill(0);
    const countData = Array(7).fill(0);

    filteredData.forEach(item => {
      const dayOfWeek = new Date(item.timestamp).getDay();
      weekdayData[dayOfWeek] += item.energyValue;
      countData[dayOfWeek]++;
    });

    // Calculate averages
    const avgData = weekdayData.map((total, index) =>
      countData[index] > 0 ? total / countData[index] : 0
    );

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    this.analysisData = {
      labels: days,
      datasets: [{
        label: 'Average Energy Consumption (kWh)',
        data: avgData,
        backgroundColor: 'rgba(55, 128, 191, 0.7)',
        borderColor: 'rgb(55, 128, 191)',
        borderWidth: 1
      }]
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              return `Energy: ${context.parsed.y.toFixed(2)} kWh`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Average Energy (kWh)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Day of Week'
          }
        }
      }
    };
  }

  generateConsumptionTrend(filteredData: any[]): void {
    // Group by date
    const dailyData: { [key: string]: { energy: number, power: number, count: number } } = {};

    filteredData.forEach(item => {
      const dateStr = new Date(item.timestamp).toISOString().split('T')[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          energy: 0,
          power: 0,
          count: 0
        };
      }

      dailyData[dateStr].energy += item.energyValue;
      dailyData[dateStr].power += item.power;
      dailyData[dateStr].count++;
    });

    // Convert to arrays for plotting
    const dates = Object.keys(dailyData).sort();
    const energyValues = dates.map(date => dailyData[date].energy);
    const powerValues = dates.map(date =>
      dailyData[date].count > 0
        ? dailyData[date].power / dailyData[date].count
        : 0
    );

    this.analysisData = {
      labels: dates,
      datasets: [
        {
          label: 'Energy (kWh)',
          data: energyValues,
          backgroundColor: 'rgba(55, 128, 191, 0.2)',
          borderColor: 'rgb(55, 128, 191)',
          borderWidth: 2,
          yAxisID: 'energy'
        },
        {
          label: 'Avg Power (kW)',
          data: powerValues,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 2,
          yAxisID: 'power'
        }
      ]
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        },
        energy: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Energy (kWh)'
          }
        },
        power: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          grid: {
            drawOnChartArea: false
          },
          title: {
            display: true,
            text: 'Power (kW)'
          }
        }
      }
    };
  }

  generateClassificationComparison(filteredData: any[]): void {
    // Group by classification
    const classData: { [key: string]: { energy: number, maxPower: number, totalPower: number, count: number } } = {};

    filteredData.forEach(item => {
      const classId = item.classificationId;
      const className = this.classifications.find(c => c.id === classId)?.name || 'Unknown';

      if (!classData[className]) {
        classData[className] = {
          energy: 0,
          maxPower: 0,
          totalPower: 0,
          count: 0
        };
      }

      classData[className].energy += item.energyValue;
      classData[className].maxPower = Math.max(classData[className].maxPower, item.power);
      classData[className].totalPower += item.power;
      classData[className].count++;
    });

    // Calculate values for comparison
    const classNames = Object.keys(classData);
    const energyValues = classNames.map(name => classData[name].energy);
    const avgPowerValues = classNames.map(name =>
      classData[name].count > 0
        ? classData[name].totalPower / classData[name].count
        : 0
    );

    // Sort by energy consumption (descending)
    const sortedIndices = energyValues
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => b.val - a.val)
      .map(item => item.idx);

    const sortedNames = sortedIndices.map(idx => classNames[idx]);
    const sortedEnergy = sortedIndices.map(idx => energyValues[idx]);
    const sortedPower = sortedIndices.map(idx => avgPowerValues[idx]);

    this.analysisData = {
      labels: sortedNames,
      datasets: [
        {
          label: 'Energy (kWh)',
          data: sortedEnergy,
          backgroundColor: 'rgba(55, 128, 191, 0.7)',
          borderColor: 'rgb(55, 128, 191)',
          borderWidth: 1
        },
        {
          label: 'Avg Power (kW)',
          data: sortedPower,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1
        }
      ]
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Value'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Classification'
          },
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    };
  }
}
