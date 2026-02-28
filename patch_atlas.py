import re

with open("src/components/AtlasDashboard.tsx", "r") as f:
    content = f.read()

# Fix the first labelFormatter signature
content = content.replace(
    'labelFormatter={(_label, payload: Array<{ payload?: { pathLabel?: string; starts?: number } }> | undefined) => {',
    'labelFormatter={(_label, payload: readonly any[] | undefined) => {'
)

# Fix the second labelFormatter signature
content = content.replace(
    'labelFormatter={(_label, payload: Array<{ payload?: { date?: string } }> | undefined) => {',
    'labelFormatter={(_label, payload: readonly any[] | undefined) => {'
)

with open("src/components/AtlasDashboard.tsx", "w") as f:
    f.write(content)
