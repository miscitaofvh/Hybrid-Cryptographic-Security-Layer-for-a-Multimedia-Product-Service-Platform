import prisma from "../config/db.js";

export async function attachSharedKey(req, res, next) {
  try {
    const sessionId = req.user?.sessionId || req.session?.id;
    if (!sessionId) return res.status(401).json({ error: "Missing session" });

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session?.pqSharedKey) {
      return res.status(401).json({ error: "Missing shared secret. Please perform key exchange first." });
    }

    req.session = req.session || {};
    req.session.sharedSecret = session.pqSharedKey;

    console.log("Shared key (hex):", session.pqSharedKey);

    next();
  } catch (error) {
    console.error("AttachSharedKey error:", error);
    return res.status(500).json({ error: "Failed to attach shared key" });
  }
}
