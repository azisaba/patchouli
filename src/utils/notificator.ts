import { PatchNote, PatchNoteCategory } from "@azisaba/graph";
import { Client, User } from "discord.js";

import { Config } from "../config";

const categoryEmoji = {
  [PatchNoteCategory.Balance]: "🔧",
  [PatchNoteCategory.Feature]: "✨",
  [PatchNoteCategory.Fix]: "🐛",
  [PatchNoteCategory.Improvement]: "📈",
} satisfies Record<PatchNoteCategory, string>;

export async function notifyPublished({
  client,
  sender,
  config,
  patchNote,
}: {
  client: Client;
  sender: User;
  config: Config;
  patchNote: PatchNote;
}) {
  const channelId = config[patchNote.target]?.channelId;
  if (!channelId) {
    return;
  }

  const channel = await client.channels.fetch(channelId);
  if (!channel) {
    throw new Error(`Discord channel \`${channelId}\` not found`);
  }
  if (!channel.isSendable()) {
    throw new Error(`Discord channel \`${channelId}\` is not sendable`);
  }

  const emoji = categoryEmoji[patchNote.category];

  await channel.send({
    content: `# ${emoji} ${patchNote.title}
    著者：${sender}
    https://www.azisaba.net/patch-notes/${patchNote.id}
    `,
  });
}
