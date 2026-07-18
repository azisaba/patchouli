import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import * as process from "node:process";

import { PatchNoteTarget } from "@azisaba/graph";
import { APIInteractionGuildMember, GuildMember } from "discord.js";
import { z } from "zod";

const configSchema = z.object({
  roles: z.record(z.string(), z.string()).optional(),
});

export type Config = z.infer<typeof configSchema>;

export async function loadConfig(): Promise<Config> {
  const path = resolve(process.cwd(), "config.json");

  const rawData = await readFile(path, "utf8");
  const json = JSON.parse(rawData);

  return configSchema.parse(json);
}

export function checkRole({
  config,
  guildMember,
  patchNoteTarget,
}: {
  config: Config;
  guildMember: GuildMember | APIInteractionGuildMember;
  patchNoteTarget: PatchNoteTarget;
}): boolean {
  const requiredRole = config?.roles?.[patchNoteTarget];
  if (!requiredRole) {
    return true;
  }

  const memberRoles = guildMember.roles;
  return Array.isArray(memberRoles)
    ? memberRoles.includes(requiredRole)
    : memberRoles.cache.has(requiredRole);
}
