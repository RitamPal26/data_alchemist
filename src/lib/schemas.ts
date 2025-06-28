import { z } from "zod";

/* Example for the Tasks sheet */
export const TaskSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
  phaseCount: z.number().int().positive(),
  maxConcurrent: z.number().int().min(1).max(10),
});

export const validateTasks = (rows: unknown[]) => {
  const errs: string[] = [];
  rows.forEach((r, idx) => {
    const res = TaskSchema.safeParse(r);
    if (!res.success) {
      errs.push(`Row ${idx + 1}: ${res.error.issues[0].message}`);
    }
  });
  return errs;
};

const ClientSchema = z.object({
  ClientID: z.string().min(1, "Client ID is required"),
  ClientName: z.string().min(1, "Client name is required"),
  PriorityLevel: z.number().int().min(1).max(5),
  RequestedTaskIDs: z.string().min(1, "Task IDs required"),
  GroupTag: z.string().min(1, "Group tag required"),
  AttributesJSON: z.string().optional(),
});

export const validateClients = (rows: any[]) => {
  const basicErrors = validateBasicSchema(rows);
  const advancedErrors = validateAdvanced(rows);
  return [...basicErrors, ...advancedErrors];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    // Convert string numbers to actual numbers for validation
    const processedRow = {
      ...row,
      PriorityLevel: parseInt(row.PriorityLevel) || 0,
    };

    const result = ClientSchema.safeParse(processedRow);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        errors.push(
          `Row ${index + 1}, ${issue.path.join(".")}: ${issue.message}`
        );
      });
    }
  });

  return errors;
};

export const validateAdvanced = (rows: ClientRow[]) => {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  rows.forEach((row, idx) => {
    // Validation 1: Duplicate IDs
    if (seenIds.has(row.ClientID)) {
      errors.push(`Row ${idx + 1}: Duplicate ClientID '${row.ClientID}'`);
    }
    seenIds.add(row.ClientID);

    // Validation 2: Malformed task ID lists
    const taskIds = row.RequestedTaskIDs.split(",");
    taskIds.forEach((id) => {
      if (!id.trim().match(/^T\d+$/)) {
        errors.push(`Row ${idx + 1}: Invalid TaskID format '${id.trim()}'`);
      }
    });

    // Validation 3: Invalid JSON in AttributesJSON
    if (row.AttributesJSON) {
      try {
        JSON.parse(row.AttributesJSON);
      } catch {
        errors.push(`Row ${idx + 1}: Invalid JSON in AttributesJSON`);
      }
    }

    // Validation 4: Priority level out of range
    if (row.PriorityLevel < 1 || row.PriorityLevel > 5) {
      errors.push(
        `Row ${idx + 1}: PriorityLevel must be 1-5, got ${row.PriorityLevel}`
      );
    }
  });

  return errors;
};

export const validateBasicSchema = (rows: any[]) => {
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const processedRow = {
      ...row,
      PriorityLevel: parseInt(row.PriorityLevel) || 0,
    };

    const result = ClientSchema.safeParse(processedRow);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        errors.push(
          `Row ${index + 1}, ${issue.path.join(".")}: ${issue.message}`
        );
      });
    }
  });

  return errors;
};

// Add to lib/schemas.ts
export const validateCrossReferences = (
  clients: any[],
  tasks: any[],
  workers: any[]
) => {
  const errors: string[] = [];
  const taskIds = new Set(tasks.map((t) => t.TaskID));
  const workerSkills = new Set(
    workers.flatMap((w) => w.Skills?.split(",").map((s) => s.trim()) || [])
  );

  // Validation 5: Unknown task references
  clients.forEach((client, idx) => {
    const requestedIds = client.RequestedTaskIDs?.split(",") || [];
    requestedIds.forEach((id) => {
      if (id.trim() && !taskIds.has(id.trim())) {
        errors.push(
          `Row ${idx + 1}: Unknown TaskID '${id.trim()}' in RequestedTaskIDs`
        );
      }
    });
  });

  // Validation 6: Skill coverage matrix
  tasks.forEach((task, idx) => {
    const requiredSkills = task.RequiredSkills?.split(",") || [];
    requiredSkills.forEach((skill) => {
      if (skill.trim() && !workerSkills.has(skill.trim())) {
        errors.push(
          `Task ${task.TaskID}: Required skill '${skill.trim()}' not available in any worker`
        );
      }
    });
  });

  // Validation 7: Malformed lists in AvailableSlots
  workers.forEach((worker, idx) => {
    if (worker.AvailableSlots) {
      try {
        const slots = JSON.parse(worker.AvailableSlots);
        if (!Array.isArray(slots) || !slots.every((s) => Number.isInteger(s))) {
          errors.push(
            `Worker ${worker.WorkerID}: AvailableSlots must be array of integers`
          );
        }
      } catch {
        errors.push(`Worker ${worker.WorkerID}: Invalid AvailableSlots format`);
      }
    }
  });

  // Validation 8: Duration validation
  tasks.forEach((task, idx) => {
    if (task.Duration < 1 || !Number.isInteger(task.Duration)) {
      errors.push(`Task ${task.TaskID}: Duration must be integer ≥ 1`);
    }
  });

  return errors;
};

export const validateWorkers = (rows: any[]) => {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  
  rows.forEach((row, idx) => {
    // Basic validation
    if (!row.WorkerID) {
      errors.push(`Row ${idx + 1}: WorkerID is required`);
    } else if (seenIds.has(row.WorkerID)) {
      errors.push(`Row ${idx + 1}: Duplicate WorkerID '${row.WorkerID}'`);
    }
    seenIds.add(row.WorkerID);
    
    // Validate AvailableSlots JSON
    if (row.AvailableSlots) {
      try {
        const slots = JSON.parse(row.AvailableSlots);
        if (!Array.isArray(slots) || !slots.every(s => Number.isInteger(s))) {
          errors.push(`Row ${idx + 1}: AvailableSlots must be array of integers`);
        }
      } catch {
        errors.push(`Row ${idx + 1}: Invalid AvailableSlots JSON format`);
      }
    }
  });
  
  return errors;
};