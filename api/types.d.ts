// Minimal ambient types for Vercel serverless functions, mirroring @vercel/node's
// VercelRequest/VercelResponse (the official package is not a project dependency).

export type VercelRequest = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body: unknown;
};

export type VercelResponse = {
  status(code: number): VercelResponse;
  json(body: unknown): void;
  setHeader(name: string, value: string): VercelResponse;
  end(): void;
};
