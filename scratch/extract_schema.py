
import json

with open(r"C:\Users\ty\.gemini\antigravity\brain\0b5d87a6-4641-476a-9f53-237fec2ed00a\.system_generated\steps\15\output.txt", "r", encoding="utf-8") as f:
    data = json.load(f)

for table in data.get("tables", []):
    if table["name"] == "public.gate_sessions":
        print(json.dumps(table, indent=2))
        break
