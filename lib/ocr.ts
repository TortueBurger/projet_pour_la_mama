import { GoogleGenerativeAI } from "@google/generative-ai";

export interface MatchRow {
  match: string;
  club: string;
}

const PROMPT = `You are a precise data extraction assistant specialized in reading handwritten sports match sheets.
Your task: extract rows from the handwritten table visible in the image.
The table has these columns (left to right): N°MATCH, CLUBS, QTE, EQUIPES/CATEGORIE/DIVISION.

Rules:
- Return ONLY a valid JSON array of objects. No markdown, no explanation, no code fences.
- Each object must have exactly two keys: "match" and "club".
- "match" = the value from the N°MATCH column (numeric string, e.g. "53541902").
- "club" = the value from the CLUBS column (numeric ID only, e.g. "523412").
- If a row has a blank or missing N°MATCH, look upward and reuse the most recent non-blank match number.
- ONLY include rows where "club" is a numeric ID (digits only). Skip rows where the club cell contains a name (letters).
- Strip all spaces from both values.
- Example output: [{"match":"53541902","club":"523412"},{"match":"55513066","club":"519793"}]`;

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function extractRowsFromImage(
  base64Image: string,
  mimeType: string
): Promise<MatchRow[]> {
  const client = getClient();
  const modelName = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";
  const model = client.getGenerativeModel({ model: modelName });

  const result = await model.generateContent([
    PROMPT,
    {
      inlineData: {
        mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp",
        data: base64Image,
      },
    },
  ]);

  const raw = result.response.text().trim();

  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned unparseable JSON: ${cleaned.slice(0, 200)}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Gemini response is not a JSON array.");
  }

  const rows: MatchRow[] = (parsed as Record<string, unknown>[])
    .filter(
      (item) =>
        typeof item.match === "string" &&
        typeof item.club === "string" &&
        item.match.trim() !== "" &&
        item.club.trim() !== "" &&
        /^\d+$/.test(item.club.trim())
    )
    .map((item) => ({
      match: (item.match as string).trim(),
      club: (item.club as string).trim(),
    }));

  return rows;
}
