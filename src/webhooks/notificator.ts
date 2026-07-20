import { PatchNote, PatchNoteCategory } from "@azisaba/graph";
import { User, WebhookClient } from "discord.js";

const categoryEmoji = {
  [PatchNoteCategory.Balance]: "🔧",
  [PatchNoteCategory.Feature]: "✨",
  [PatchNoteCategory.Fix]: "🐛",
  [PatchNoteCategory.Improvement]: "📈",
} satisfies Record<PatchNoteCategory, string>;

export async function notify({
  webhook,
  patchNote,
  author = undefined,
}: {
  webhook: WebhookClient;
  patchNote: PatchNote;
  author?: User;
}) {
  const emoji = categoryEmoji[patchNote.category];

  await webhook.send({
    content: `# ${emoji} ${patchNote.title}
    ${author ? `Special thanks to ${author}!` : ""}
    https://www.azisaba.net/patch-notes/${patchNote.id}
    `,
    ...(author && {
      username: author.displayName,
      avatarURL: author.displayAvatarURL({
        extension: "png",
        size: 256,
      }),
    }),
  });
}
