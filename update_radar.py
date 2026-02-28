with open("src/components/Trajectory/CollectiveRadar.tsx", "r") as f:
    content = f.read()

if "interface CollectiveRadarProps" in content:
    if "externalTension" not in content:
        content = content.replace("interface CollectiveRadarProps {", "interface CollectiveRadarProps {\n    externalTension?: any;")
        with open("src/components/Trajectory/CollectiveRadar.tsx", "w") as f:
            f.write(content)
