const https = require("https");
https.get("https://www.tiktok.com/@khaby.lame/video/7161405105214049541", {
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    }
}, (res) => {
    let data = "";
    res.on("data", chunk => data += chunk);
    res.on("end", () => {
        let match = data.match(/<script\s+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
        if(match) {
            const json = JSON.parse(match[1]);
            const ds = json["__DEFAULT_SCOPE__"];
            const vd = ds["webapp.video-detail"];
            const fs = require("fs");
            fs.writeFileSync("vd.json", JSON.stringify(vd, null, 2));
            console.log("Written to vd.json");
        } else {
            console.log("No Universal Data");
        }
    });
}).on("error", console.error);
