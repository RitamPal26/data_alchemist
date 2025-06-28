# gen_samples.py
import pandas as pd, random, json, os, pathlib

outdir = pathlib.Path("samples")
outdir.mkdir(exist_ok=True)

# ------- clients ----------
clients = []
for i in range(1, 201):          # 200 rows
    clients.append({
        "ClientID":        f"C{i:03}",
        "ClientName":      f"Client {i}",
        "PriorityLevel":   random.randint(1, 5),
        "RequestedTaskIDs": ",".join([f"T{random.randint(1,50):03}"]),
        "GroupTag":        random.choice(["GroupA", "GroupB"]),
        "AttributesJSON":  json.dumps({"vip": bool(random.getrandbits(1))}),
    })
pd.DataFrame(clients).to_csv(outdir / "clients_big.csv", index=False)

# ------- workers ----------
workers = []
skillbank = ["Python", "Excel", "SQL", "Communication"]
for i in range(1, 51):           # 50 workers
    workers.append({
        "WorkerID":          f"W{i:03}",
        "WorkerName":        f"Worker {i}",
        "Skills":            ",".join(random.sample(skillbank, 2)),
        "AvailableSlots":    str(sorted(random.sample([1,2,3,4,5], k=3))),
        "MaxLoadPerPhase":   random.randint(2,4),
        "WorkerGroup":       random.choice(["GroupA","GroupB"]),
        "QualificationLevel":random.randint(1,3),
    })
pd.DataFrame(workers).to_csv(outdir / "workers_big.csv", index=False)

# ------- tasks ------------
tasks = []
for i in range(1, 51):          # 50 tasks
    tasks.append({
        "TaskID":          f"T{i:03}",
        "TaskName":        f"Task {i}",
        "Category":        random.choice(["Data","Infra","Ops","Analytics"]),
        "Duration":        random.randint(1,3),
        "RequiredSkills":  random.choice(skillbank),
        "PreferredPhases": random.choice(["1-3","[2,4]","[3]"]),
        "MaxConcurrent":   random.randint(1,3),
    })
pd.DataFrame(tasks).to_csv(outdir / "tasks_big.csv", index=False)

print("✔  Sample files written to /samples")
