/** Framework-independent shapes shared by the planning modules and UI. */
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "PENDING" | "COMPLETED";
export type Confidence = "LOW" | "MEDIUM" | "HIGH";
export type DateLike = Date | string;

export interface PlanningTask {
  id: string;
  title: string;
  category: string;
  estimatedMinutes: number;
  predictedMinutes: number;
  priority: Priority;
  deadline: DateLike;
  scheduledStart?: DateLike | null;
  scheduledEnd?: DateLike | null;
  status: TaskStatus;
  actualMinutes?: number | null;
  interruptionCount: number;
  createdAt?: DateLike;
  completedAt?: DateLike | null;
}

/** This deliberately mirrors only the fields persisted in TaskHistory. */
export interface HistoricalTask {
  id?: string;
  title: string;
  category: string;
  estimatedMinutes: number;
  actualMinutes: number;
  startHour: number;
  interruptionCount: number;
  completedAt: DateLike;
}

export interface PredictionInput {
  title?: string;
  category: string;
  estimatedMinutes: number;
  /** The proposed time, used solely for the time-of-day adjustment. */
  scheduledStart?: DateLike | null;
}

export interface PredictionResult {
  predictedMinutes: number;
  originalEstimate: number;
  categoryBiasFactor: number;
  timeOfDayFactor: number;
  interruptionOverhead: number;
  confidence: Confidence;
  explanation: string;
}

export interface ScheduledTask extends PlanningTask {
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  isDeadlineRisk: boolean;
}

export interface ScheduleResult {
  tasks: ScheduledTask[];
  deadlineRiskCount: number;
}

export interface CategoryAnalytics {
  category: string;
  biasFactor: number;
  completedTaskCount: number;
}

export interface AnalyticsSummary {
  completedTaskCount: number;
  meanAbsoluteError: number;
  categoryBiases: CategoryAnalytics[];
  durationPairs: Array<{
    title: string;
    category: string;
    estimatedMinutes: number;
    actualMinutes: number;
  }>;
}
