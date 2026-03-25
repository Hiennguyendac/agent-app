import OpenAI from "openai";
import type {
  Document,
  DocumentAnalysis
} from "../../../packages/shared-types/index.js";

let openAiClient: OpenAI | null = null;
const OPENAI_TIMEOUT_MS = 60000;

export async function analyzeDocumentContent(
  document: Document,
  createdByUserId: string
): Promise<Omit<DocumentAnalysis, "id" | "documentId" | "createdAt">> {
  const metadataText = JSON.stringify(document.metadata ?? {}, null, 2);
  const extractedText = document.extractedText?.trim() || "No extracted text was available.";

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
                    "You are an internal school intake analyst. " +
                    "Review the uploaded document, summarize it, identify the likely school workflow, " +
                    "and suggest whether it should become a work item. Return plain text only."
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: [
                    `Filename: ${document.filename}`,
                    `OCR Status: ${document.ocrStatus}`,
                    "Metadata:",
                    metadataText,
                    "",
                    "Extracted Text:",
                    extractedText.slice(0, 12000),
                    "",
                    "Use four sections:",
                    "1. Document Summary",
                    "2. Key Metadata",
                    "3. Intake Risks",
                    "4. Suggested Work Item"
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
        throw new Error("Document analysis returned an empty response.");
      }

      return {
        summary: rawOutput.split("\n").slice(0, 8).join("\n"),
        rawOutput,
        model,
        createdByUserId
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const fallbackOutput = [
      "Document Summary",
      `${document.filename} was uploaded and is ready for school workflow review.`,
      "",
      "Key Metadata",
      `OCR Status: ${document.ocrStatus}`,
      `Has Extracted Text: ${document.extractedText?.trim() ? "yes" : "no"}`,
      "",
      "Intake Risks",
      "AI analysis is currently unavailable, so the document needs manual operator review.",
      "",
      "Suggested Work Item",
      "Review the document manually and create a work item if operational follow-up is required."
    ].join("\n");

    return {
      summary: `AI fallback summary for ${document.filename}`,
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
