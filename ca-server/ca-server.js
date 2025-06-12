const express = require("express");
const https = require("https");
const fs = require("fs");
const { createSign } = require("crypto");
const { createVerify } = require("crypto");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const key = fs.readFileSync("./ec_private_key.pem");
let cert;
try {
    cert = fs.readFileSync("./ec_cert.pem");
} catch {
    throw new Error("Bạn cần tạo file ec_cert.pem (self-signed cert) để dùng HTTPS!");
}

const httpsOptions = { key, cert };

app.post("/verify", (req, res) => {
    const { data, signature } = req.body;
    if (!data || !signature)
        return res.status(400).json({ valid: false, error: "Missing data or signature" });
    if (typeof data !== "string")
        return res.status(400).json({ valid: false, error: "Data must be stringified JSON." });

    const verifyObj = createVerify("SHA256");
    verifyObj.update(data);
    verifyObj.end();

    const pubKey = fs.readFileSync("./ec_public_key.pem", "utf8");
    const isValid = verifyObj.verify(pubKey, Buffer.from(signature, "base64"));

    res.json({ valid: isValid });
});

app.post("/sign", (req, res) => {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: "Missing data" });
    if (typeof data !== "string") return res.status(400).json({ error: "Data must be stringified JSON." });

    const signObj = createSign("SHA256");
    signObj.update(data);
    signObj.end();
    const signature = signObj.sign(key, "base64");

    res.json({ signature });
});

app.get("/public-key", (req, res) => {
    const pubKey = fs.readFileSync("./ec_public_key.pem", "utf8");
    res.type("text/plain").send(pubKey);
});

const PORT = 4000;
https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`HTTPS+Sign server running at https://localhost:${PORT}`);
});
