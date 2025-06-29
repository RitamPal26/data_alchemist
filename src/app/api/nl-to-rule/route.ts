// app/api/nl-to-rule/route.ts
import { NextRequest } from "next/server";
import { cohere } from "@/lib/cohere";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      throw new Error("Invalid prompt provided");
    }

    const response = await cohere.chat({
      model: "command-r-plus",
      message: `Convert this natural language rule into JSON format:
"${prompt}"

Return ONLY valid JSON in this exact format:
{
  "id": "rule-${Date.now()}",
  "name": "descriptive name",
  "condition": {
    "field": "column_name",
    "operator": "equals|contains|greater_than|less_than|not_empty|unique",
    "value": "expected_value"
  },
  "action": "flag|correct|remove",
  "weight": 5
}

Examples:
"Email must not be empty" → {"field": "email", "operator": "not_empty", "value": ""}
"Duration over 8 hours" → {"field": "duration", "operator": "greater_than", "value": 8}`,
      temperature: 0.1,
    });

    let rule;
    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      rule = JSON.parse(jsonMatch?.[0] || "{}");
    } catch {
      rule = generateFallbackRule(prompt);
    }

    return Response.json(rule);
  } catch (error) {
    console.error("❌ NL to Rule API Error:", error);

    // Return a safe fallback rule
    return Response.json({
      id: `rule-${Date.now()}`,
      name: "Error Rule",
      condition: { field: "unknown", operator: "not_empty", value: "" },
      action: "flag",
      weight: 5,
      error: "Failed to process natural language input",
    });
  }
}

function generateFallbackRule(prompt: string) {
  const patterns = [
    {
      regex: /(\w+)\s+must\s+not\s+be\s+empty/i,
      rule: (field: string) => ({
        id: `rule-${Date.now()}`,
        name: `${field} Required`,
        condition: {
          field: field.toLowerCase(),
          operator: "not_empty",
          value: "",
        },
        action: "flag",
        weight: 5,
      }),
    },
    {
      regex: /(\w+)\s+(?:over|greater than|>)\s+(\d+)/i,
      rule: (field: string, value: string) => ({
        id: `rule-${Date.now()}`,
        name: `${field} Maximum Check`,
        condition: {
          field: field.toLowerCase(),
          operator: "greater_than",
          value: parseInt(value),
        },
        action: "flag",
        weight: 5,
      }),
    },
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern.regex);
    if (match) return pattern.rule(...match.slice(1));
  }

  return {
    id: `rule-${Date.now()}`,
    name: "Generated Rule",
    condition: { field: "unknown", operator: "not_empty", value: "" },
    action: "flag",
    weight: 5,
  };
}
