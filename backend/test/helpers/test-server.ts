import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createClient } from '@supabase/supabase-js';
import app from '../../src/app.js';
import { config } from '@config/env.config.js';

/** The real Express app on a random port. */
export async function startServer(): Promise<{ server: Server; origin: string }> {
  const server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  return { server, origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}` };
}

export function stopServer(server: Server | undefined): Promise<void> {
  return new Promise((resolve) => (server ? server.close(() => resolve()) : resolve()));
}

/** Integration specs need the local Supabase keys in backend/.env; they are skipped otherwise. */
export const supabaseReady = Boolean(config.supabase.anonKey && config.supabase.serviceRoleKey);

/** Access token for a seed account (supabase/seed.sql, password Password123!). */
export async function tokenFor(email: string): Promise<string> {
  const client = createClient(config.supabase.url, config.supabase.anonKey, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password: 'Password123!' });
  if (error) throw error;
  return data.session.access_token;
}

/** fetch() with JSON body and an optional bearer token. */
export function call(origin: string, method: string, path: string, token?: string, body?: unknown): Promise<Response> {
  return fetch(origin + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
