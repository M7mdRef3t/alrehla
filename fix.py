with open("vite.config.ts", "r") as f:
    content = f.read()

content = content.replace('__DEFINES__: "({})",', '__DEFINES__: "{}",')

with open("vite.config.ts", "w") as f:
    f.write(content)
