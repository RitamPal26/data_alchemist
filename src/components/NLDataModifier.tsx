// components/NLDataModifier.tsx
import { useState } from "react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export function NLDataModifier({ fileName }: { fileName: string }) {
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [modifications, setModifications] = useState([]);
  const { rows, processSheet } = useStore();

  const handleModify = async () => {
    if (!prompt.trim() || !rows[fileName]) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/nl-modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          data: rows[fileName],
          fileName,
        }),
      });

      const { modifications: mods } = await response.json();
      setModifications(mods);

      if (mods.length === 0) {
        toast.info("No modifications suggested");
      } else {
        toast.success(`Found ${mods.length} suggested modifications`);
      }
    } catch (error) {
      toast.error("Failed to process request");
    } finally {
      setIsProcessing(false);
    }
  };

  const applyModifications = () => {
    if (modifications.length === 0) return;

    const updatedData = [...rows[fileName]];

    modifications.forEach((mod: any) => {
      if (updatedData[mod.rowIndex]) {
        updatedData[mod.rowIndex][mod.field] = mod.newValue;
      }
    });

    // Reprocess with validation
    const validator = getValidator(detectFileType(fileName));
    processSheet(fileName, updatedData, validator);

    setModifications([]);
    toast.success(`Applied ${modifications.length} modifications`);
  };

  return (
    <div className="bg-card p-4 rounded-lg border space-y-4">
      <h3 className="font-medium">✨ AI Data Cleaning</h3>

      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Fix email formats, Remove test data, Standardize phone numbers"
          className="flex-1 px-3 py-2 border rounded-md text-sm"
        />
        <button
          onClick={handleModify}
          disabled={isProcessing || !prompt.trim()}
          className="bg-primary text-white px-4 py-2 rounded-md text-sm"
        >
          {isProcessing ? "Processing..." : "Analyze"}
        </button>
      </div>

      {modifications.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Suggested Changes:</h4>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {modifications.map((mod: any, i: number) => (
              <div key={i} className="text-xs bg-accent p-2 rounded">
                Row {mod.rowIndex}: {mod.field} "{mod.oldValue}" → "
                {mod.newValue}"
                <div className="text-muted-foreground">{mod.reason}</div>
              </div>
            ))}
          </div>
          <button
            onClick={applyModifications}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm"
          >
            Apply All Changes
          </button>
        </div>
      )}
    </div>
  );
}
