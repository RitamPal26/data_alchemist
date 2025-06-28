"use client";
import { useEffect, useState } from "react";
import { QueryBuilder } from "react-querybuilder";
import "react-querybuilder/dist/query-builder.css";
import { useStore } from "@/lib/store";

export default function RuleBuilder() {
  const addRule = useStore((s) => s.addRule);
  const rules = useStore((s) => s.rules);
  const rows = useStore((s) => s.rows);
  const [mounted, setMounted] = useState(false);
  const [naturalRule, setNaturalRule] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Generate rule recommendations when component mounts
    if (Object.keys(rows).length > 0) {
      setRecommendations(generateRuleRecommendations());
    }
  }, [rows]);

  const parseNaturalRule = (text: string) => {
    const lower = text.toLowerCase();

    if (lower.includes("co-run") || lower.includes("together")) {
      const taskIds = text.match(/T\d+/g) || [];
      return {
        type: "coRun",
        tasks: taskIds,
        description: `Tasks ${taskIds.join(", ")} must run together`,
      };
    }

    if (lower.includes("load limit") || lower.includes("max load")) {
      const number = text.match(/\d+/)?.[0];
      const group = text.match(/group[a-z]/i)?.[0];
      return {
        type: "loadLimit",
        maxSlotsPerPhase: parseInt(number || "5"),
        group: group || "all",
        description: `Maximum ${number} concurrent slots for ${group || "all groups"}`,
      };
    }

    if (lower.includes("slot restriction") || lower.includes("phase window")) {
      const phases = text.match(/phase\s+(\d+)/gi) || [];
      return {
        type: "slotRestriction",
        phases: phases.map((p) => p.match(/\d+/)?.[0]).filter(Boolean),
        description: `Restrict slots to ${phases.join(", ")}`,
      };
    }

    if (
      lower.includes("precedence") ||
      lower.includes("before") ||
      lower.includes("after")
    ) {
      const taskIds = text.match(/T\d+/g) || [];
      const isBefore = lower.includes("before");
      return {
        type: "precedence",
        firstTask: taskIds[0],
        secondTask: taskIds[1],
        order: isBefore ? "before" : "after",
        description: `${taskIds[0]} must run ${isBefore ? "before" : "after"} ${taskIds[1]}`,
      };
    }

    return null;
  };

  const generateAIRecommendations = async () => {
    setLoading(true);

    try {
      console.log("🤖 Calling AI recommendations...");

      const response = await fetch("/api/ai-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clients: rows["clients.csv"] || [],
          tasks: rows["tasks.csv"] || [],
          workers: rows["workers.csv"] || [],
        }),
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("📋 Received data:", data);

      setAiRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("❌ Client error:", error);
      // Set fallback recommendations
      setAiRecommendations([
        "AI service temporarily unavailable",
        "Manually review task patterns for optimization",
        "Consider load balancing for high-priority clients",
      ]);
    }

    setLoading(false);
  };

  const generateRuleRecommendations = () => {
    const recommendations: string[] = [];
    const clients = rows["clients.csv"] || rows["clients.xlsx"] || [];

    if (clients.length === 0) return recommendations;

    // Find frequently co-requested tasks
    const taskPairs: Record<string, number> = {};
    clients.forEach((client) => {
      const tasks =
        client.RequestedTaskIDs?.split(",").map((t: string) => t.trim()) || [];
      for (let i = 0; i < tasks.length; i++) {
        for (let j = i + 1; j < tasks.length; j++) {
          const pair = [tasks[i], tasks[j]].sort().join("-");
          taskPairs[pair] = (taskPairs[pair] || 0) + 1;
        }
      }
    });

    // Recommend co-run rules for frequently paired tasks
    Object.entries(taskPairs).forEach(([pair, count]) => {
      if (count >= 2) {
        const [task1, task2] = pair.split("-");
        recommendations.push(
          `${task1} and ${task2} are requested together ${count} times. Add co-run rule?`
        );
      }
    });

    // Check for high priority clients with many tasks
    const highPriorityClients = clients.filter(
      (c: any) => parseInt(c.PriorityLevel) >= 4
    );
    if (highPriorityClients.length > 0) {
      recommendations.push(
        `${highPriorityClients.length} high-priority clients detected. Consider load balancing rules.`
      );
    }

    return recommendations;
  };

  const applyRecommendation = (recommendation: string) => {
    // Extract task IDs from recommendation
    const taskIds = recommendation.match(/T\d+/g) || [];
    if (taskIds.length >= 2) {
      const rule = {
        type: "coRun",
        tasks: taskIds,
        description: `Auto-generated: ${taskIds.join(" and ")} co-run rule`,
        source: "ai_recommendation",
      };
      addRule(rule);
    }
  };

  if (!mounted) {
    return (
      <div className="my-6">
        <h3 className="font-bold mb-2">Rules</h3>
        <div className="p-4 border rounded bg-gray-50">
          Loading rule builder...
        </div>
      </div>
    );
  }

  return (
    <div className="my-6">
      <h3 className="font-bold mb-4">📋 Rule Builder</h3>

      {/* Visual Rule Builder */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Visual Rule Builder</h4>
        <QueryBuilder
          fields={[
            { name: "taskId", label: "Task ID", inputType: "text" },
            { name: "workerId", label: "Worker ID", inputType: "text" },
            { name: "phase", label: "Phase", inputType: "number" },
            {
              name: "priorityLevel",
              label: "Priority Level",
              inputType: "number",
            },
            { name: "groupTag", label: "Group Tag", inputType: "text" },
          ]}
          operators={[
            { name: "=", label: "equals" },
            { name: "!=", label: "does not equal" },
            { name: ">", label: "greater than" },
            { name: "<", label: "less than" },
            { name: "in", label: "in list" },
          ]}
          onQueryChange={(q) =>
            addRule({
              ...q,
              type: "custom",
              description: "Custom rule from visual builder",
            })
          }
        />
      </div>

      {/* Natural Language Rule Input */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-medium mb-2">🤖 Natural Language Rule Input</h4>
        <input
          type="text"
          placeholder="e.g., 'T001 and T002 should run together' or 'Set load limit to 3 for GroupA'"
          value={naturalRule}
          onChange={(e) => setNaturalRule(e.target.value)}
          className="w-full p-3 border rounded mb-2"
        />
        <button
          onClick={() => {
            const rule = parseNaturalRule(naturalRule);
            if (rule) {
              addRule(rule);
              setNaturalRule("");
            } else {
              alert(
                'Could not parse rule. Try: "T001 and T002 together" or "load limit 3"'
              );
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Convert to Rule
        </button>
      </div>

      {/* AI Rule Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
          <h4 className="font-medium mb-2">🎯 AI Rule Recommendations</h4>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-green-700">{rec}</span>
                <button
                  onClick={() => applyRecommendation(rec)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Rules List */}
      {rules.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-2">
            📝 Current Rules ({rules.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {rules.map((rule: any, index) => (
              <div
                key={index}
                className="p-2 bg-gray-50 border rounded text-sm"
              >
                <div className="font-medium">{rule.type || "Custom Rule"}</div>
                <div className="text-gray-600">
                  {rule.description || JSON.stringify(rule).slice(0, 100)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Rule Templates */}
      <div className="mt-6">
        <h4 className="font-medium mb-2">⚡ Quick Rule Templates</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() =>
              addRule({
                type: "coRun",
                tasks: ["T001", "T002"],
                description: "Template: Co-run rule for T001 and T002",
              })
            }
            className="p-2 bg-gray-100 border rounded text-sm hover:bg-gray-200"
          >
            Co-run Template
          </button>
          <button
            onClick={() =>
              addRule({
                type: "loadLimit",
                maxSlotsPerPhase: 3,
                description: "Template: Load limit 3 slots per phase",
              })
            }
            className="p-2 bg-gray-100 border rounded text-sm hover:bg-gray-200"
          >
            Load Limit Template
          </button>
          <button
            onClick={generateAIRecommendations}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            {loading ? "🤖 Analyzing..." : "🧠 Get AI Recommendations"}
          </button>
        </div>
      </div>
    </div>
  );
}
