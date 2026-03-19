import type { Task, TaskResult } from "../../../packages/shared-types/index.js";
import { runGrowthAgent } from "../../agent-growth/src/index.js";

/**
 * This file contains the smallest possible orchestrator for the MVP.
 *
 * The orchestrator receives a Task and decides which agent should handle it.
 * For now, the only supported path is the Growth agent.
 */

export async function routeTask(task: Task): Promise<TaskResult> {
  /**
   * The shared types currently allow only "growth",
   * but this check still makes the routing rule explicit
   * and beginner-friendly to read.
   */
  if (task.taskType === "growth") {
    // Log when the orchestrator routes the task to the Growth agent.
    console.log(`[orchestrator] Routing task ${task.id} to growth-agent`);
    return await runGrowthAgent(task);
  }

  /**
   * This fallback is here so the function has a clear error path
   * if new task types are added later without updating the router.
   */
  throw new Error(`Unsupported task type: ${task.taskType}`);
}
