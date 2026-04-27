import { NextRequest, NextResponse } from "next/server";
import { extractRowsFromImage, MatchRow } from "@/lib/ocr";
import { buildExcelBuffer } from "@/lib/excel";

export const runtime = "nodejs";
// Large images can take time to process; allow up to 60 s
export const maxDuration = 60;

/**
 * POST /api/process
 *
 * Two modes:
 *   1. multipart/form-data with field "images" → runs OCR on each image,
 *      returns JSON { rows: MatchRow[] } for preview.
 *   2. application/json with { rows, download: true } → generates and
 *      returns the Excel file as a binary response.
 */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  // ── Mode 2: generate Excel from already-extracted rows ──────────────────
  if (contentType.includes("application/json")) {
    let body: { rows: MatchRow[]; download: boolean };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return NextResponse.json({ error: "No rows provided." }, { status: 400 });
    }

    const buffer = buildExcelBuffer(body.rows);

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="delegues_manquants.xlsx"',
      },
    });
  }

  // ── Mode 1: OCR images from multipart upload ─────────────────────────────
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Expected multipart/form-data or application/json." },
      { status: 415 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Could not parse form data." }, { status: 400 });
  }

  const imageFiles = formData.getAll("images") as File[];
  if (imageFiles.length === 0) {
    return NextResponse.json({ error: "No images uploaded." }, { status: 400 });
  }

  const allRows: MatchRow[] = [];
  const errors: string[] = [];

  await Promise.all(
    imageFiles.map(async (file) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const mime = file.type || "image/jpeg";
        const rows = await extractRowsFromImage(base64, mime);
        allRows.push(...rows);
      } catch (e) {
        errors.push(
          `${file.name}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    })
  );

  if (errors.length > 0 && allRows.length === 0) {
    return NextResponse.json(
      { error: `OCR failed for all images.\n${errors.join("\n")}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ rows: allRows, warnings: errors });
}
