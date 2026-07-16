import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import * as process from "node:process";

import { z } from "zod";

const patchNoteTargetConfigSchema = z.object({
  publisherRoleId: z.string().optional(),
  notificationChannelId: z.string().optional(),
});

const configSchema = z.object({
  basePath: z.string().optional(),
  patchNoteTargets: z.record(z.string(), patchNoteTargetConfigSchema.optional()),
});

export type Config = z.infer<typeof configSchema>;

export async function loadConfig(): Promise<Config> {
  const path = resolve(process.cwd(), "config.json");

  const rawData = await readFile(path, "utf8");
  const json = JSON.parse(rawData);

  return configSchema.parse(json);
}
