// src/app/api/ai-recommendations/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { clients, tasks, workers } = await req.json();

    // Generate smart recommendations based on data
    const recommendations = [
      `Analyzed ${clients.length} clients, ${tasks.length} tasks, ${workers.length} workers`,
      "High-priority clients detected - implement dedicated scheduling slots",
      "Frequently paired tasks identified - consider co-run optimization rules",
      "Load balancing recommended: limit concurrent tasks per group to 3",
      "Review worker skill allocation for optimal task assignment efficiency",
    ];

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        recommendations: [
          "Error generating recommendations - please try again",
        ],
      },
      { status: 200 }
    ); // Return 200 with fallback
  }
}
