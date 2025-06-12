import axios from 'axios';
import https from 'https';

export async function verifySignature(req, res, next) {
    const { publicKey, metadata, signature } = req.body;
    if (!publicKey || !metadata || !signature) {
        return res.status(400).json({ error: 'Missing publicKey, metadata, or signature' });
    }

    try {
        const data = JSON.stringify({ publicKey, metadata });
        const agent = new https.Agent({ rejectUnauthorized: false });
        const kgaRes = await axios.post(
            'https://ca:4000/verify',
            { data, signature },
            { httpsAgent: agent }
        );

        if (!kgaRes.data.valid) {
            return res.status(401).json({ error: 'CA signature verification failed' });
        }
        next();
    } catch (err) {
        console.error('Error contacting CA server:', err.message);
        return res.status(503).json({ error: 'CA server unreachable or verification failed' });
    }
}
