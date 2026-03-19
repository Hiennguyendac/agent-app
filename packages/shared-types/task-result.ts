/**
 * TaskResult is the output returned after an agent finishes work.
 *
 * In the MVP, this can hold a simple mock response from the Growth agent.
 */
export interface TaskResult {
  /**
   * The ID of the task this result belongs to.
   */
  taskId: string;

  /**
   * The name of the agent that created the result.
   * Example: "growth-agent"
   */
  agentName: string;

  /**
   * The final text output shown to the user.
   * Example: a simple blog draft or blog idea list.
   */
  outputText: string;

  /**
   * The date and time when the result was created.
   * Stored as a string for simplicity in the MVP.
   */
  createdAt: string;
}
