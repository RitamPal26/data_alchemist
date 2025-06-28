"use client";
import { useStore } from "@/lib/store";

export default function ProgressDashboard() {
  const rows = useStore((s) => s.rows);
  const errors = useStore((s) => s.errors);

  // --- DATA CALCULATION REMAINS EXACTLY THE SAME ---
  const stats = Object.keys(rows).map((sheet) => {
    const rowCount = rows[sheet]?.length || 0;
    const errorCount = errors[sheet]?.length || 0;
    const validRows = rowCount - errorCount;
    const validationRate = rowCount > 0 ? (validRows / rowCount) * 100 : 0;

    return {
      sheet,
      rowCount,
      errorCount,
      validationRate: Math.max(0, validationRate),
    };
  });

  if (stats.length === 0) return null;

  // --- MARKUP & CLASSES MODIFIED FOR NEW STYLING ---
  return (
    <div className="enterprise-card my-6 bg-card p-6 rounded-lg border border-border shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        📊 Data Quality Dashboard
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ sheet, rowCount, errorCount, validationRate }) => (
          <div
            key={sheet}
            // Each sheet stat gets a small stat-card
            className="stat-card bg-secondary p-4 rounded-md"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Left side: Sheet name and stats */}
              <div className="flex-grow">
                <h4
                  className="font-semibold text-secondary-foreground truncate"
                  title={sheet}
                >
                  {sheet}
                </h4>
                <p className="text-2xl font-bold text-foreground">
                  {rowCount.toLocaleString()}
                </p>
                <p className="text-sm font-medium text-destructive">
                  {errorCount.toLocaleString()} issues
                </p>
              </div>

              {/* Right side: Circular progress ring */}
              <div
                className="w-20 h-20 rounded-full grid place-items-center flex-shrink-0"
                style={{
                  // The ring is created with a conic-gradient for progress
                  // and a radial-gradient to cut out the center.
                  background: `
                    radial-gradient(
                      var(--secondary) 60%, 
                      transparent 61%
                    ),
                    conic-gradient(
                      var(--primary) ${validationRate}%, 
                      var(--border) 0
                    )
                  `,
                }}
                role="progressbar"
                aria-valuenow={validationRate}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span className="text-base font-bold text-primary">
                  {validationRate.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
