// src/app/models/models.ts
export interface Classification {
  id: number;
  name: string;
  type: string;
  energyType: string;
  measurementUnit: string;
}

export interface MeteringData {
  id: number;
  timestamp: string;
  energyValue: number;
  power: number;
  classificationId: number;
  classification?: Classification;
}

export interface EnPI {
  id: number;
  name: string;
  formula: string;
  baselineValue: number;
  currentValue: number;
  calculationDate: string;
  classificationId: number;
  classification?: Classification;
}

export interface EnPICalculationRequest {
  name: string;
  formula: string;
  classificationId: number;
  startDate: Date;
  endDate: Date;
  baselineStartDate?: Date | null;
  baselineEndDate?: Date | null;
}

export interface EnPIDefinition {
  id: number;
  name: string;
  classificationId: number;
  classification?: Classification;
  formulaType: string;
  normalizeBy: string;
  normalizationUnit?: string;
  description?: string;
  createdAt: string;
  targets?: Target[];
}

export interface Target {
  id: number;
  enpiDefinitionId: number;
  enpiDefinition?: EnPIDefinition;
  targetValue: number;
  targetType: string;
  targetDate: string;
  description?: string;
  createdAt: string;
}

export interface Baseline {
  id: number;
  classificationId: number;
  classification?: Classification;
  startDate: string;
  endDate: string;
  description?: string;
  createdAt: string;
}

export interface SyntheticDataRequest {
  classificationId: number;
  startDate: Date;
  endDate: Date;
  intervalMinutes: number;
  baseValue: number;
  variance: number;
}

export interface SystemStatus {
  status: string;
  message: string;
}
