import type { TaskStatus } from "./task-status";
import type { TaskType } from "./task-type";

/**
 * Task is the main object that moves through the MVP system.
 *
 * A user creates this object first.
 * Then the API, orchestrator, and agent all work with it.
 */
export interface Task {
  /**
   * A unique ID for the task.
   * Example: "task_001"
   */
  id: string;

  /**
   * The kind of task being requested.
   * For now, only "growth" is supported.
   */
  taskType: TaskType;

  /**
   * A short title so the user can recognize the task quickly.
   */
  title: string;

  /**
   * The main business goal of the task.
   * Example: "Generate blog ideas for a small agency website"
   */
  goal: string;

  /**
   * The target audience for the content or recommendation.
   * Example: "small business owners"
   */
  audience: string;

  /**
   * Extra notes from the user.
   * This field is optional because the user may leave it empty.
   */
  notes?: string;

  /**
   * Optional task owner identifier for future multi-user support.
   *
   * Existing tasks may not have an owner yet.
   */
  ownerId?: string;

  /**
   * The current state of the task.
   */
  status: TaskStatus;

  /**
   * The date and time when the task was created.
   * Stored as a string for simplicity in the MVP.
   */
  createdAt: string;
}
