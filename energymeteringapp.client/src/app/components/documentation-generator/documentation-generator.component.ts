// energymeteringapp.client/src/app/components/documentation-generator/documentation-generator.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-documentation-generator',
  templateUrl: './documentation-generator.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DocumentationGeneratorComponent implements OnInit {
  documentTypes = [
    { id: 'energyPolicy', name: 'Energy Policy' },
    { id: 'energyReview', name: 'Energy Review' },
    { id: 'energyBaseline', name: 'Energy Baseline Report' },
    { id: 'enpiReport', name: 'EnPI Report' },
    { id: 'actionPlan', name: 'Energy Action Plan' },
    { id: 'complianceReport', name: 'ISO 50001 Compliance Report' }
  ];

  formData = {
    documentType: 'energyReview',
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    title: '',
    includeCharts: true,
    includeRawData: false,
    format: 'pdf'
  };

  selectedDocument: string = '';
  generatedDocument: any = null;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  documentContent: string = '';
  previewMode = false;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    // Set default title based on selected document type
    this.updateTitle();
  }

  updateTitle(): void {
    const selectedType = this.documentTypes.find(t => t.id === this.formData.documentType);
    if (selectedType) {
      const today = new Date().toISOString().split('T')[0];
      this.formData.title = `${selectedType.name} - ${today}`;
    }
  }

  onDocumentTypeChange(): void {
    this.updateTitle();
  }

  generateDocument(): void {
    this.loading = true;
    this.error = null;
    this.success = null;

    // In a real implementation, this would call an API endpoint
    // For now, we'll simulate a delay and generate mock content
    setTimeout(() => {
      try {
        this.documentContent = this.generateMockDocument();
        this.previewMode = true;
        this.success = 'Document generated successfully!';
      } catch (err) {
        this.error = 'Failed to generate document. Please try again.';
        console.error('Error generating document:', err);
      } finally {
        this.loading = false;
      }
    }, 1500);
  }

  downloadDocument(): void {
    // Create a blob from the document content
    const documentBlob = new Blob([this.documentContent], { type: 'text/plain' });

    // Create a link element to download the blob
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(documentBlob);
    link.download = `${this.formData.title.replace(/\s+/g, '_')}.txt`;
    link.click();
  }

  generateMockDocument(): string {
    const selectedType = this.documentTypes.find(t => t.id === this.formData.documentType);
    let content = '';

    // Add document title
    content += `${this.formData.title}\n`;
    content += '='.repeat(this.formData.title.length) + '\n\n';

    // Add document date range
    content += `Period: ${this.formData.startDate} to ${this.formData.endDate}\n\n`;

    // Add document content based on type
    switch (this.formData.documentType) {
      case 'energyPolicy':
        content += this.generateEnergyPolicyContent();
        break;
      case 'energyReview':
        content += this.generateEnergyReviewContent();
        break;
      case 'energyBaseline':
        content += this.generateEnergyBaselineContent();
        break;
      case 'enpiReport':
        content += this.generateEnPIReportContent();
        break;
      case 'actionPlan':
        content += this.generateActionPlanContent();
        break;
      case 'complianceReport':
        content += this.generateComplianceReportContent();
        break;
      default:
        content += 'No content template available for the selected document type.';
    }

    // Add footer
    content += '\n\n';
    content += '-'.repeat(80) + '\n';
    content += `Generated on: ${new Date().toISOString()}\n`;
    content += 'ISO 50001 Energy Management System Documentation\n';

    return content;
  }

  generateEnergyPolicyContent(): string {
    return `
ENERGY POLICY

Our organization is committed to improving energy performance through the implementation of an Energy Management System (EnMS) in compliance with ISO 50001. This energy policy establishes our commitment to:

1. Continual improvement in energy performance
2. Ensuring the availability of information and resources to achieve energy objectives and targets
3. Complying with applicable legal and other requirements related to energy use
4. Supporting the procurement of energy-efficient products and services
5. Designing for energy performance improvement

SCOPE

This policy applies to all operations and facilities under our direct control.

COMMITMENTS

- We will establish, implement, maintain, and improve an EnMS
- We will regularly review and set energy objectives and targets
- We will provide the resources necessary to achieve our energy goals
- We will ensure that all employees are aware of their responsibilities
- We will communicate our energy performance and achievements

RESPONSIBILITY

The Energy Management Team is responsible for implementing this policy and reporting on energy performance to top management.

APPROVAL

This Energy Policy has been approved by top management and is effective as of ${new Date().toLocaleDateString()}.
`;
  }

  generateEnergyReviewContent(): string {
    return `
ENERGY REVIEW

INTRODUCTION

This energy review provides an analysis of energy use and consumption within our organization for the period ${this.formData.startDate} to ${this.formData.endDate}. It identifies significant energy uses, establishes a baseline, and identifies opportunities for improvement.

METHODOLOGY

Data was collected from energy meters, utility bills, and operational records. Analysis was performed using our Energy Metering Dashboard application.

ENERGY CONSUMPTION SUMMARY

Total Electricity Consumption: 1,245,320 kWh
Total Natural Gas Consumption: 25,430 therms
Total Energy Cost: $187,450

SIGNIFICANT ENERGY USES (SEUs)

1. HVAC Systems (42% of total energy)
2. Production Equipment (28% of total energy)
3. Lighting (15% of total energy)
4. Office Equipment (8% of total energy)
5. Other (7% of total energy)

ENERGY PERFORMANCE INDICATORS (EnPIs)

1. Energy consumption per square foot: 14.5 kWh/ft²
2. Energy consumption per unit produced: 3.2 kWh/unit
3. Peak demand: 550 kW

IMPROVEMENT OPPORTUNITIES

1. Upgrade HVAC controls (Est. savings: 120,000 kWh/year)
2. LED lighting retrofit (Est. savings: 85,000 kWh/year)
3. Air compressor optimization (Est. savings: 45,000 kWh/year)
4. Production equipment scheduling (Est. savings: 65,000 kWh/year)

RECOMMENDATIONS

Based on this energy review, we recommend implementing the improvement opportunities in the following order:
1. LED lighting retrofit (highest ROI)
2. Air compressor optimization
3. HVAC controls upgrade
4. Production equipment scheduling

NEXT STEPS

1. Develop detailed action plans for each improvement opportunity
2. Establish energy objectives and targets
3. Allocate resources for implementation
4. Monitor and measure results
`;
  }

  generateEnergyBaselineContent(): string {
    return `
ENERGY BASELINE REPORT

INTRODUCTION

This report establishes the energy baseline for our organization based on data from ${this.formData.startDate} to ${this.formData.endDate}. The energy baseline serves as a reference for comparing energy performance over time.

BASELINE PERIOD SELECTION

The baseline period was selected to represent normal operating conditions and to include all seasonal variations in energy use. The period covers 12 months of operations.

ENERGY CONSUMPTION DATA

Monthly Electricity Consumption (kWh):
Jan: 105,420
Feb: 98,750
Mar: 100,320
Apr: 95,600
May: 103,450
Jun: 115,700
Jul: 120,350
Aug: 118,900
Sep: 110,300
Oct: 98,750
Nov: 93,780
Dec: 104,000

RELEVANT VARIABLES

The following variables affect energy consumption and have been considered in the baseline:
1. Production volume
2. Heating and cooling degree days
3. Occupancy

NORMALIZATION FACTORS

To account for variations in production and weather, the following normalization factors have been applied:
1. Production: kWh per unit produced
2. Weather: kWh per degree day

BASELINE ENERGY PERFORMANCE INDICATORS

1. Base load: 85,000 kWh/month
2. Weather-dependent load: 350 kWh/degree day
3. Production-dependent load: 2.8 kWh/unit
4. Energy intensity: 14.5 kWh/ft²/year

BASELINE ADJUSTMENT CRITERIA

The baseline will be adjusted under the following circumstances:
1. Major changes in processes, operations, or facilities
2. Discovery of errors in baseline data
3. Changes in primary energy sources
4. Significant changes in relevant variables

This baseline will be used to evaluate energy performance improvements and to set realistic energy objectives and targets.
`;
  }

  generateEnPIReportContent(): string {
    return `
ENERGY PERFORMANCE INDICATORS (EnPI) REPORT

INTRODUCTION

This report presents the Energy Performance Indicators (EnPIs) for our organization for the period ${this.formData.startDate} to ${this.formData.endDate}. EnPIs are used to monitor and measure energy performance against the established baseline.

EnPI METHODOLOGY

EnPIs were developed based on our significant energy uses and normalized for relevant variables such as production, weather, and occupancy. The following methodologies were used:
1. Regression analysis for weather normalization
2. Linear normalization for production volume
3. Direct measurement for specific processes

ENERGY PERFORMANCE INDICATORS

1. Total Energy Consumption
   Baseline: 1,265,320 kWh
   Current: 1,189,750 kWh
   Improvement: 6.0%

2. Energy Intensity (kWh/ft²)
   Baseline: 15.4 kWh/ft²
   Current: 14.5 kWh/ft²
   Improvement: 5.8%

3. Energy per Unit Produced (kWh/unit)
   Baseline: 3.4 kWh/unit
   Current: 3.1 kWh/unit
   Improvement: 8.8%

4. Peak Demand (kW)
   Baseline: 580 kW
   Current: 550 kW
   Improvement: 5.2%

5. HVAC Energy Efficiency (kWh/degree day)
   Baseline: 380 kWh/degree day
   Current: 350 kWh/degree day
   Improvement: 7.9%

TREND ANALYSIS

Most EnPIs show improvement compared to the baseline, with the greatest improvement in energy per unit produced (8.8%). This is attributed to the production scheduling optimization implemented in Q2.

TARGETS VS. ACTUAL PERFORMANCE

EnPI         | Target  | Actual  | Status
-------------+---------+---------+--------
Total Energy | -5.0%   | -6.0%   | Achieved
Energy/ft²   | -5.0%   | -5.8%   | Achieved
Energy/unit  | -7.5%   | -8.8%   | Achieved
Peak Demand  | -7.5%   | -5.2%   | In Progress
HVAC         | -10.0%  | -7.9%   | In Progress

RECOMMENDATIONS

1. Continue with the current energy management practices for production
2. Focus on peak demand reduction strategies
3. Implement remaining HVAC optimization measures
4. Review and adjust EnPI targets for the next period
`;
  }

  generateActionPlanContent(): string {
    return `
ENERGY ACTION PLAN

INTRODUCTION

This Energy Action Plan outlines the specific actions to be taken to achieve our energy objectives and targets for the period ${this.formData.startDate} to ${this.formData.endDate}.

ENERGY OBJECTIVES AND TARGETS

1. Reduce total energy consumption by 10% compared to baseline by ${this.formData.endDate}
2. Reduce peak demand by 15% compared to baseline by ${this.formData.endDate}
3. Improve HVAC energy efficiency by 12% compared to baseline by ${this.formData.endDate}
4. Implement energy monitoring for all significant energy uses by ${this.formData.endDate}

ACTION ITEMS

1. LED Lighting Retrofit
   - Description: Replace all T8 fluorescent fixtures with LED fixtures
   - Energy Saving Estimate: 85,000 kWh/year
   - Cost Estimate: $62,000
   - ROI: 2.1 years
   - Timeline: Start - 2023-06-01, End - 2023-08-31
   - Responsible: Facilities Manager
   - Status: In Progress

2. HVAC Controls Upgrade
   - Description: Install DDC controls and optimize sequences of operation
   - Energy Saving Estimate: 120,000 kWh/year
   - Cost Estimate: $105,000
   - ROI: 2.5 years
   - Timeline: Start - 2023-09-01, End - 2023-12-31
   - Responsible: Facilities Engineer
   - Status: Planned

3. Air Compressor Optimization
   - Description: Repair leaks, reduce pressure, optimize controls
   - Energy Saving Estimate: 45,000 kWh/year
   - Cost Estimate: $18,000
   - ROI: 1.2 years
   - Timeline: Start - 2023-07-15, End - 2023-09-15
   - Responsible: Maintenance Manager
   - Status: Planned

4. Production Equipment Scheduling
   - Description: Optimize equipment start-up and shutdown procedures
   - Energy Saving Estimate: 65,000 kWh/year
   - Cost Estimate: $5,000
   - ROI: 0.2 years
   - Timeline: Start - 2023-06-15, End - 2023-07-31
   - Responsible: Production Manager
   - Status: Planned

RESOURCE REQUIREMENTS

1. Budget: $190,000
2. Personnel: Facilities team, maintenance team, production team
3. Training: HVAC controls, energy monitoring system

MONITORING AND REPORTING

Progress will be monitored monthly and reported to the Energy Management Team. The action plan will be reviewed quarterly and updated as needed.

APPROVAL

This Energy Action Plan has been approved by top management on ${new Date().toLocaleDateString()}.
`;
  }

  generateComplianceReportContent(): string {
    return `
ISO 50001 COMPLIANCE REPORT

INTRODUCTION

This report assesses our organization's compliance with the requirements of ISO 50001:2018 Energy Management System standard for the period ${this.formData.startDate} to ${this.formData.endDate}.

EXECUTIVE SUMMARY

Our organization has implemented an Energy Management System (EnMS) in accordance with ISO 50001:2018. This report evaluates our compliance with the standard's requirements and identifies areas for improvement.

Overall compliance status: 92% compliant

COMPLIANCE ASSESSMENT

4. Context of the Organization: 100% compliant
   - Energy management system scope and boundaries are defined
   - Internal and external issues are identified
   - Needs and expectations of interested parties are determined

5. Leadership: 95% compliant
   - Energy policy is established and communicated
   - Roles and responsibilities are assigned
   - Improvement opportunity: Enhance management review process

6. Planning: 90% compliant
   - Energy review is conducted
   - SEUs are identified
   - EnPIs are established
   - Energy baseline is established
   - Improvement opportunity: Enhance risk assessment process

7. Support: 95% compliant
   - Resources are provided
   - Competence requirements are defined
   - Training is provided
   - Improvement opportunity: Enhance internal communication

8. Operation: 85% compliant
   - Operational criteria are established
   - Design activities consider energy performance
   - Improvement opportunity: Strengthen procurement process
   - Improvement opportunity: Enhance documentation of operational controls

9. Performance Evaluation: 90% compliant
   - Monitoring and measurement are conducted
   - EnPIs are evaluated
   - Internal audits are conducted
   - Management reviews are conducted
   - Improvement opportunity: Enhance calibration program

10. Improvement: 90% compliant
    - Nonconformities are addressed
    - Corrective actions are implemented
    - Continual improvement is demonstrated
    - Improvement opportunity: Enhance root cause analysis process

CONCLUSIONS AND RECOMMENDATIONS

Our organization has demonstrated a high level of compliance with ISO 50001:2018. The EnMS is effectively implemented and maintained. Key strengths include leadership commitment, energy review process, and monitoring system.

Areas for improvement include:
1. Enhance risk assessment process
2. Strengthen procurement process
3. Improve internal communication about energy performance
4. Enhance documentation of operational controls
5. Strengthen calibration program

NEXT STEPS

1. Develop action plans to address identified improvement opportunities
2. Conduct internal audit focused on areas of lower compliance
3. Update EnMS documentation
4. Prepare for surveillance audit
`;
  }
}
