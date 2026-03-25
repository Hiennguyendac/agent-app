import OpenAI from "openai";
import type {
  AiAnalysis,
  WorkItem,
  WorkItemFile
} from "../../../packages/shared-types/index.js";

let openAiClient: OpenAI | null = null;
const OPENAI_TIMEOUT_MS = 60000;

export async function analyzeWorkItemContent(
  workItem: WorkItem,
  files: WorkItemFile[],
  createdByUserId: string
): Promise<Omit<AiAnalysis, "id" | "workItemId" | "createdAt">> {
  const fileDigest = files
    .slice(0, 3)
    .map((file) => `- ${file.filename}`)
    .join("\n");

  try {
    const client = getOpenAiClient();
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), OPENAI_TIMEOUT_MS);

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
                    "You are an internal school workflow analyst. " +
                    "Summarize the work item, call out important operational risks, " +
                    "and suggest a short next action list. Return plain text only."
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: [
                    `Work Item Title: ${workItem.title}`,
                    `Description: ${workItem.description}`,
                    `Status: ${workItem.status}`,
                    `Department ID: ${workItem.departmentId ?? "None"}`,
                    `Attached Files:`,
                    fileDigest || "- None",
                    "",
                    "Use three sections:",
                    "1. Summary",
                    "2. Risks",
                    "3. Recommended Next Steps"
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
        throw new Error("AI analysis returned an empty response.");
      }

      return {
        summary: rawOutput.split("\n").slice(0, 6).join("\n"),
        rawOutput,
        model,
        createdByUserId
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const fallbackOutput = [
      "Summary",
      `${workItem.title} is currently in ${workItem.status} and needs internal review.`,
      "",
      "Risks",
      files.length > 0
        ? `Attached files exist (${files.length}), but AI analysis could not be completed.`
        : "No attached files were available for AI review.",
      "",
      "Recommended Next Steps",
      "1. Review the work item manually.",
      "2. Confirm the department and assignee.",
      "3. Retry AI analysis after the service issue is resolved."
    ].join("\n");

    return {
      summary: `AI fallback summary for ${workItem.title}`,
      rawOutput:
        `${fallbackOutput}\n\nAI analysis fallback reason: ${
          error instanceof Error ? error.message : String(error)
        }`,
      model: "local-fallback",
      createdByUserId
    };
  }
}

function getOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  if (!openAiClient) {
    openAiClient = new OpenAI({ apiKey });
  }

  return openAiClient;
}
