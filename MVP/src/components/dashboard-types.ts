export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "PENDING" | "COMPLETED";
export type Confidence = "LOW" | "MEDIUM" | "HIGH";

export interface TaskView {
  id: string;
  title: string;
  category: string;
  estimatedMinutes: number;
  predictedMinutes: number;
  priority: Priority;
  deadline: string;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  status: TaskStatus;
  actualMinutes?: number | null;
  interruptionCount: number;
  createdAt?: string;
  completedAt?: string | null;
  deadlineRisk?: boolean;
  prediction?: PredictionView;
}

export interface PredictionView {
  originalEstimate: number;
  categoryBiasFactor: number;
  timeOfDayFactor: number;
  interruptionOverhead: number;
  confidence: Confidence;
  explanation: string;
}

export interface AnalyticsView {
  completedTaskCount: number;
  meanAbsoluteError: number;
  categoryBiases: Array<{ category: string; factor: number }>;
  durationComparison: Array<{
    label: string;
    estimatedMinutes: number;
    actualMinutes: number;
  }>;
}

export interface NewTaskInput {
  title: string;
  category: string;
  estimatedMinutes: number;
  priority: Priority;
  deadline: string;
  preferredStart?: string;
}

export interface DashboardActions {
  onCreateTask?: (input: NewTaskInput) => Promise<void> | void;
  onCompleteTask?: (id: string, actualMinutes: number) => Promise<void> | void;
  onDeleteTask?: (id: string) => Promise<void> | void;
  onSimulateDelay?: (id: string) => Promise<void> | void;
  onResetDemo?: () => Promise<void> | void;
}
