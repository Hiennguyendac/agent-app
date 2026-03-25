import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export interface DocumentExtractionResult {
  extractedText?: string;
  ocrStatus: "pending" | "ready" | "failed";
  extractionNote?: string;
}

export async function extractDocumentText(params: {
  filename: string;
  contentType?: string;
  contentBase64?: string;
  existingExtractedText?: string;
}): Promise<DocumentExtractionResult> {
  const normalizedExistingText = params.existingExtractedText?.trim();

  if (normalizedExistingText) {
    return {
      extractedText: normalizedExistingText,
      ocrStatus: "ready"
    };
  }

  if (!params.contentBase64) {
    return {
      ocrStatus: "pending",
      extractionNote: "No binary content was provided for server-side extraction."
    };
  }

  const fileBuffer = Buffer.from(params.contentBase64, "base64");
  const lowerFilename = params.filename.toLowerCase();
  const contentType = (params.contentType ?? "").toLowerCase();

  try {
    if (
      lowerFilename.endsWith(".docx") ||
      contentType.includes(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ) {
      const result = await mammoth.extractRawText({
        buffer: fileBuffer
      });
      const extractedText = normalizeExtractedText(result.value);

      if (!extractedText) {
        return {
          ocrStatus: "failed",
          extractionNote: "DOCX extraction completed but no text was found."
        };
      }

      return {
        extractedText,
        ocrStatus: "ready"
      };
    }

    if (lowerFilename.endsWith(".pdf") || contentType.includes("application/pdf")) {
      const parser = new PDFParse({ data: fileBuffer });

      try {
        const result = await parser.getText();
        const extractedText = normalizeExtractedText(result.text);

        if (!extractedText) {
          return {
            ocrStatus: "failed",
            extractionNote: "PDF extraction completed but no text was found."
          };
        }

        return {
          extractedText,
          ocrStatus: "ready"
        };
      } finally {
        await parser.destroy();
      }
    }

    return {
      ocrStatus: "pending",
      extractionNote: "No server-side extractor is configured for this file type yet."
    };
  } catch (error) {
    return {
      ocrStatus: "failed",
      extractionNote:
        error instanceof Error ? error.message : "Document extraction failed."
    };
  }
}

function normalizeExtractedText(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value
    .replaceAll("\u0000", "")
    .replaceAll("\r\n", "\n")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim();

  return normalized.length > 0 ? normalized : undefined;
}
