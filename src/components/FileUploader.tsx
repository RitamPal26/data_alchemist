"use client";
import { useCallback, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useStore } from "@/lib/store";
import { validateClients, validateTasks, validateWorkers } from "@/lib/schemas";
import { fileExt } from "@/lib/utils";

export default function FileUploader() {
  const { setRows, setErrors } = useStore();
  const [busy, setBusy] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const detectFileType = (filename: string) => {
    const lower = filename.toLowerCase();
    if (lower.includes("client")) return "clients";
    if (lower.includes("worker")) return "workers";
    if (lower.includes("task")) return "tasks";
    return "unknown";
  };

  const getValidator = (fileType: string) => {
    switch (fileType) {
      case "clients":
        return validateClients;
      case "workers":
        return validateWorkers;
      case "tasks":
        return validateTasks;
      default:
        return validateClients; // fallback
    }
  };

  const parse = useCallback(
    async (file: File) => {
      setBusy(true);
      const ext = fileExt(file.name);
      const fileType = detectFileType(file.name);

      let rows: any[] = [];

      if (ext === "csv") {
        rows = await new Promise<any[]>((ok) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (res) => ok(res.data as any[]),
          });
        });
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "buffer" });
        rows = XLSX.utils.sheet_to_json<any>(wb.Sheets[wb.SheetNames[0]], {
          defval: "",
        });
      }

      const validator = getValidator(fileType);
      setRows(file.name, rows);
      setErrors(file.name, validator(rows));

      // Track uploaded files
      setUploadedFiles((prev) => [
        ...prev.filter((f) => f !== file.name),
        file.name,
      ]);
      setBusy(false);
    },
    [setRows, setErrors]
  );

  return (
    <div className="my-4">
      <input
        id="file-upload"
        type="file"
        accept=".csv,.xlsx,.xls"
        multiple // Allow multiple files
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            Array.from(e.target.files).forEach((file) => parse(file));
          }
        }}
      />
      <label
        htmlFor="file-upload"
        className={`inline-block px-4 py-2 rounded cursor-pointer text-white font-medium ${
          busy
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {busy ? "Uploading…" : "Select CSV / XLSX Files"}
      </label>

      {uploadedFiles.length > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          Uploaded: {uploadedFiles.join(", ")}
        </div>
      )}
    </div>
  );
}
