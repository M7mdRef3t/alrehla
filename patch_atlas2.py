import re

with open("src/components/AtlasDashboard.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'labelFormatter={(_label: unknown, payload: Array<{ payload?: { pathLabel?: string; starts?: number } }> | undefined) =>',
    'labelFormatter={(_label: unknown, payload: readonly any[] | undefined) =>'
)

content = content.replace(
    'labelFormatter={(_label: unknown, payload: Array<{ payload?: { date?: string } }> | undefined) => payload?.[0]?.payload?.date ?? ""}',
    'labelFormatter={(_label: unknown, payload: readonly any[] | undefined) => payload?.[0]?.payload?.date ?? ""}'
)

with open("src/components/AtlasDashboard.tsx", "w") as f:
    f.write(content)
