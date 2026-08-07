import type { Response } from 'express';

// Consistent success-response envelopes.

export function ok<T>(res: Response, data: T, meta?: unknown): Response {
  const body: Record<string, unknown> = { success: true, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(200).json(body);
}

export function created<T>(res: Response, data: T): Response {
  return res.status(201).json({ success: true, data });
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}
