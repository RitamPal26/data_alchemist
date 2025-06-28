"use client";
import { useEffect, useState } from "react";
import { QueryBuilder } from "react-querybuilder";
import "react-querybuilder/dist/query-builder.css";
import { useStore } from "@/lib/store";

// Define tab types for better type safety
type Tab = "natural" | "visual" | "templates";

export default function RuleBuilder() {
  const addRule = useStore((s) => s.addRule);
  const rules = useStore((s) => s.rules);
  const rows = useStore((s) => s.rows);
  const [mounted, setMounted] = useState(false);
  const [naturalRule, setNaturalRule] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("natural");

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
        <h3 className="font-bold mb-2">📋 Rule Builder</h3>
        <div className="p-4 border rounded bg-gray-50">Loading...</div>
      </div>
    );
  }

  return (
    <div className="my-6">
      <h3 className="text-lg font-semibold mb-2 text-foreground">
        📋 Rule Builder
      </h3>

      {/* --- NEW: Tab Navigation --- */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("natural")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm transition-colors
              ${
                activeTab === "natural"
                  ? "font-semibold border-primary text-primary"
                  : "font-medium border-transparent text-muted-foreground hover:border-gray-300"
              }`}
          >
            Natural Language
          </button>
          <button
            onClick={() => setActiveTab("visual")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm transition-colors
              ${
                activeTab === "visual"
                  ? "font-semibold border-primary text-primary"
                  : "font-medium border-transparent text-muted-foreground hover:border-gray-300"
              }`}
          >
            Visual Builder
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm transition-colors
              ${
                activeTab === "templates"
                  ? "font-semibold border-primary text-primary"
                  : "font-medium border-transparent text-muted-foreground hover:border-gray-300"
              }`}
          >
            Templates & AI
          </button>
        </nav>
      </div>

      {/* --- NEW: Tab Content Wrapper --- */}
      <div className="enterprise-card bg-card border border-border rounded-lg rounded-t-none p-6 -mt-px">
        {/* --- Tab 1: Natural Language --- */}
        {activeTab === "natural" && (
          <div className="animate-fade-in">
            <h4 className="font-semibold text-foreground mb-2">
              Create a Rule with Plain English
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Type a command and we'll convert it into a formal rule for the
              scheduler.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g., 'T001 and T002 must co-run'"
                value={naturalRule}
                onChange={(e) => setNaturalRule(e.target.value)}
                className="w-full p-2 border rounded-md bg-secondary"
              />
              <button
                onClick={() => {
                  const rule = parseNaturalRule(naturalRule);
                  if (rule) {
                    addRule(rule);
                    setNaturalRule("");
                  } else {
                    alert("Could not parse rule.");
                  }
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Create Rule
              </button>
            </div>
          </div>
        )}

        {/* --- Tab 2: Visual Builder --- */}
        {activeTab === "visual" && (
          <div className="animate-fade-in">
            <h4 className="font-semibold text-foreground mb-4">
              Construct a Rule with Conditions
            </h4>
            <QueryBuilder
              fields={
                [
                  /* ... existing fields ... */
                ]
              }
              operators={
                [
                  /* ... existing operators ... */
                ]
              }
              onQueryChange={(q) =>
                addRule({
                  ...q,
                  type: "custom",
                  description: "Custom rule from visual builder",
                })
              }
            />
          </div>
        )}

        {/* --- Tab 3: Templates & AI --- */}
        {activeTab === "templates" && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                ⚡ Quick Rule Templates
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    addRule({
                      type: "coRun",
                      tasks: ["T001", "T002"],
                      description: "Template: Co-run",
                    })
                  }
                  className="p-3 bg-secondary border rounded text-sm hover:bg-accent"
                >
                  Co-run Template
                </button>
                <button
                  onClick={() =>
                    addRule({
                      type: "loadLimit",
                      maxSlotsPerPhase: 3,
                      description: "Template: Load limit",
                    })
                  }
                  className="p-3 bg-secondary border rounded text-sm hover:bg-accent"
                >
                  Load Limit Template
                </button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                🎯 AI Recommendations
              </h4>
              <div className="space-y-2">
                {aiRecommendations.length > 0 ? (
                  aiRecommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm p-2 bg-secondary rounded"
                    >
                      <span>{rec}</span>
                      <button
                        onClick={() => applyRecommendation(rec)}
                        className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
                      >
                        Apply
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click the button to get AI-powered suggestions based on your
                    data.
                  </p>
                )}
              </div>
              <button
                onClick={generateAIRecommendations}
                disabled={loading}
                className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                {loading ? "🤖 Analyzing..." : "🧠 Get AI Recommendations"}
              </button>
            </div>
          </div>
        )}

        {/* --- Persistent: Current Rules List --- */}
        {rules.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="font-medium mb-2 text-foreground">
              Active Rules ({rules.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto p-1">
              {rules.map((rule: any, index) => (
                <div
                  key={index}
                  className="p-2 bg-secondary border rounded text-sm"
                >
                  <p className="font-semibold text-secondary-foreground">
                    {rule.description || "Custom Rule"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
