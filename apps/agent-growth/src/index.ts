import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import OpenAI from "openai";
import type { Task, TaskResult } from "../../../packages/shared-types/index.js";

/**
 * This file contains the Growth agent for the MVP.
 *
 * It accepts a Task, calls a real AI model, and returns
 * one readable TaskResult that matches the existing app contract.
 */

loadEnvironmentVariables();

let openAiClient: OpenAI | null = null;
const OPENAI_TIMEOUT_MS = 90000;

const REQUIRED_SECTIONS = [
  "Summary",
  "Target Audience Insight",
  "Key Message",
  "Content Outline",
  "Draft Content",
  "CTA"
] as const;

export async function runGrowthAgent(task: Task): Promise<TaskResult> {
  // Log when the Growth agent starts processing the task.
  console.log(`[growth-agent] Starting task ${task.id}`);
  const contentType = detectContentType(task);
  const outputText = await generateGrowthContent(task, contentType);

  const result: TaskResult = {
    taskId: task.id,
    agentName: "growth-agent",
    outputText,
    createdAt: new Date().toISOString()
  };

  // Log when the Growth agent finishes and returns a result.
  console.log(`[growth-agent] Finished task ${task.id}`);

  return result;
}

async function generateGrowthContent(
  task: Task,
  contentType: string
): Promise<string> {
  const client = getOpenAiClient();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";
  const abortController = new AbortController();
  const timeout = setTimeout(() => {
    abortController.abort();
  }, OPENAI_TIMEOUT_MS);

  try {
    const response = await client.responses.create(
      {
        model,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "You are a practical senior growth content strategist. " +
                  "Write clear, useful marketing content that directly uses the task input. " +
                  "Return plain text markdown only. " +
                  "Use exactly these section headings in this order: " +
                  "## Summary, ## Target Audience Insight, ## Key Message, " +
                  "## Content Outline, ## Draft Content, ## CTA. " +
                  "Make the output concrete, specific, and ready to use. " +
                  "Do not mention being an AI model."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: [
                  `Content Type: ${contentType}`,
                  `Title: ${task.title}`,
                  `Goal: ${task.goal}`,
                  `Audience: ${task.audience}`,
                  `Notes: ${task.notes?.trim() || "No additional notes"}`,
                  "",
                  "Write a useful first draft for this task.",
                  "Keep it readable, practical, and tailored to the exact audience and goal."
                ].join("\n")
              }
            ]
          }
        ]
      },
      {
        signal: abortController.signal
      }
    );

    const rawOutput = response.output_text?.trim();

    if (!rawOutput) {
      throw new Error("The AI model returned an empty response.");
    }

    return normalizeStructuredOutput(rawOutput, contentType, task);
  } catch (error) {
    throw new Error(getReadableAiErrorMessage(error));
  } finally {
    clearTimeout(timeout);
  }
}

function detectContentType(task: Task): string {
  const sourceText = `${task.title} ${task.goal} ${task.notes ?? ""}`.toLowerCase();

  if (sourceText.includes("facebook")) {
    return "Facebook Post";
  }

  if (sourceText.includes("sales email") || sourceText.includes("email")) {
    return "Sales Email";
  }

  if (sourceText.includes("landing page")) {
    return "Landing Page Copy";
  }

  return "Blog SEO";
}

function normalizeStructuredOutput(
  rawOutput: string,
  contentType: string,
  task: Task
): string {
  const trimmedOutput = rawOutput.trim();
  const hasEverySection = REQUIRED_SECTIONS.every((section) =>
    trimmedOutput.includes(`## ${section}`)
  );

  if (hasEverySection) {
    return `# ${contentType}: ${task.title}\n\n${trimmedOutput}`;
  }

  /**
   * If the model drifts from the requested format, keep the response usable
   * by placing the raw output into the Draft Content section.
   */
  return [
    `# ${contentType}: ${task.title}`,
    "",
    "## Summary",
    `Create a useful ${contentType.toLowerCase()} draft for the goal: ${task.goal}.`,
    "",
    "## Target Audience Insight",
    `${task.audience} should see a message that matches their real problem and desired next step.`,
    "",
    "## Key Message",
    `The draft should help ${task.audience} understand why this offer or idea matters now.`,
    "",
    "## Content Outline",
    "1. Problem or opportunity",
    "2. Core promise or value",
    "3. Proof, explanation, or detail",
    "4. Direct next step",
    "",
    "## Draft Content",
    trimmedOutput,
    "",
    "## CTA",
    "Use one clear next action that matches the goal of this task."
  ].join("\n");
}

function getOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to your .env file to enable AI-generated Growth content."
    );
  }

  if (!openAiClient) {
    openAiClient = new OpenAI({ apiKey });
  }

  return openAiClient;
}

function getReadableAiErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "Unknown AI generation error";
  const normalizedMessage = message.toLowerCase();

  if (
    (error instanceof Error && error.name === "AbortError") ||
    normalizedMessage.includes("aborted") ||
    normalizedMessage.includes("timeout")
  ) {
    return "Growth agent AI generation failed: the AI request timed out. Please try again.";
  }

  if (typeof error === "object" && error !== null && "status" in error) {
    const status = Number((error as { status?: unknown }).status);

    if (status === 401) {
      return "Growth agent AI generation failed: the AI API key was rejected. Check OPENAI_API_KEY.";
    }

    if (status === 429) {
      return "Growth agent AI generation failed: the AI service rate limit was reached. Please try again shortly.";
    }

    if (status >= 500) {
      return "Growth agent AI generation failed: the AI service is temporarily unavailable. Please try again.";
    }
  }

  return `Growth agent AI generation failed: ${message}`;
}

function loadEnvironmentVariables(): void {
  const candidatePaths = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../../.env")
  ];

  for (const path of candidatePaths) {
    if (existsSync(path)) {
      loadEnv({ path });
      return;
    }
  }
}
