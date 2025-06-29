// app/api/nl-modify/route.ts
import { NextRequest } from "next/server";
import { cohere } from "@/lib/cohere";

export async function POST(req: NextRequest) {
  try {
    const { prompt, data, fileName } = await req.json();

    // Only process first 20 rows to keep it fast
    const sampleData = data.slice(0, 20);

    const response = await cohere.chat({
      model: "command-r-plus",
      message: `Analyze this data and suggest modifications based on the request:

REQUEST: "${prompt}"

DATA SAMPLE (first 20 rows):
${JSON.stringify(sampleData, null, 2)}

Return ONLY valid JSON with modifications:
{
  "modifications": [
    {
      "rowIndex": 0,
      "field": "column_name",
      "oldValue": "current_value", 
      "newValue": "corrected_value",
      "reason": "why this change was made"
    }
  ]
}

Focus on:
- Data cleaning (remove test/invalid entries)
- Format standardization (emails, phones, dates)
- Filling missing values
- Fixing obvious typos`,
      temperature: 0.2,
    });

    let result;
    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch?.[0] || '{"modifications": []}');
    } catch {
      result = { modifications: [] };
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ modifications: [], error: "Processing failed" });
  }
}
