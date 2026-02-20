import { NextResponse } from "next/server";
import { ingestDocument } from "@/lib/rag";

const ALLOWED_EXTENSIONS = [".txt", ".md", ".pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const pdf = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await pdf.getText();
  return result.text;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    let text = "";
    let source = "unknown";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      // Check for URL mode
      const url = formData.get("url");
      if (url && typeof url === "string") {
        const res = await fetch(url);
        if (!res.ok) {
          return NextResponse.json(
            { error: `Failed to fetch URL: ${res.statusText}` },
            { status: 400 }
          );
        }
        const html = await res.text();
        text = stripHtml(html);
        source = url;
      }
      // Check for raw text mode
      else if (formData.has("text")) {
        text = formData.get("text") as string;
        source = (formData.get("title") as string) || "Pasted text";
      }
      // Check for file upload mode
      else if (formData.has("file")) {
        const file = formData.get("file") as File;

        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: "File size exceeds 10 MB limit." },
            { status: 400 }
          );
        }

        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          return NextResponse.json(
            {
              error: `Unsupported file type: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
            },
            { status: 400 }
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        if (ext === ".pdf") {
          text = await extractTextFromPdf(buffer);
        } else {
          text = buffer.toString("utf-8");
        }

        source = file.name;
      } else {
        return NextResponse.json(
          { error: "No file, text, or URL provided." },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Expected multipart/form-data." },
        { status: 400 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Extracted text is empty." },
        { status: 400 }
      );
    }

    const result = await ingestDocument(text, { source });
    return NextResponse.json({ ...result, source });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 500 }
    );
  }
}
