import type { VercelRequest, VercelResponse } from "./types";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({ ok: true, uptime: process.uptime() });
}
