import {
  instanceOfPatchNoteCategory,
  instanceOfPatchNoteTarget,
  PatchNoteCategory,
  PatchNotesApi,
  PatchNoteTarget,
  PlayersApi,
} from "@azisaba/graph";
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  FileUploadBuilder,
  LabelBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  SlashCommandSubcommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
  WebhookClient,
} from "discord.js";

import { checkRole, Config } from "../config";
import { notify } from "../webhooks/notificator";

const patchNoteTargetNames = {
  [PatchNoteTarget.CreativePro]: "CreativePro",
  [PatchNoteTarget.Frontier]: "Frontier",
  [PatchNoteTarget.Life]: "Life",
  [PatchNoteTarget.LeonGunWar2]: "LGW2",
  [PatchNoteTarget.Sclat]: "Sclat",
} satisfies Record<PatchNoteTarget, string>;

const patchNoteCategoryNames = {
  [PatchNoteCategory.Balance]: "🔧 バランス",
  [PatchNoteCategory.Feature]: "✨ 新機能",
  [PatchNoteCategory.Fix]: "🐛 バグ修正",
  [PatchNoteCategory.Improvement]: "📈 改善",
} satisfies Record<PatchNoteCategory, string>;

export function buildPatchNotePublishSubcommand(
  builder: SlashCommandSubcommandBuilder,
): SlashCommandSubcommandBuilder {
  return builder.setName("publish").setDescription("パッチノートを作成します");
}

export async function receivePatchNotePublishSubcommand(interaction: ChatInputCommandInteraction) {
  const targetLabel = new LabelBuilder()
    .setLabel("📦 サーバー")
    .setDescription("どのサーバーについてのパッチノートですか？")
    .setStringSelectMenuComponent(
      new StringSelectMenuBuilder()
        .setCustomId("target")
        .setOptions(
          Object.values(PatchNoteTarget).map((target) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(patchNoteTargetNames[target])
              .setValue(target),
          ),
        ),
    );

  const categoryLabel = new LabelBuilder()
    .setLabel("🏷️ カテゴリ")
    .setDescription("このパッチノートのカテゴリを選択してください。")
    .setStringSelectMenuComponent(
      new StringSelectMenuBuilder()
        .setCustomId("category")
        .setOptions(
          Object.values(PatchNoteCategory).map((category) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(patchNoteCategoryNames[category])
              .setValue(category),
          ),
        ),
    );

  const titleLabel = new LabelBuilder()
    .setLabel("✨ タイトル")
    .setDescription("一言でパッチノートの内容を表してください。")
    .setTextInputComponent(
      new TextInputBuilder().setCustomId("title").setStyle(TextInputStyle.Short),
    );

  const bodyLabel = new LabelBuilder()
    .setLabel("📝 本文")
    .setDescription("このパッチノートの詳細を書いてください。")
    .setTextInputComponent(
      new TextInputBuilder().setCustomId("body").setStyle(TextInputStyle.Paragraph),
    );

  const imagesLabel = new LabelBuilder()
    .setLabel("🎨 画像")
    .setDescription("このパッチノートを説明する画像を10枚まで添付できます（任意）。")
    .setFileUploadComponent(
      new FileUploadBuilder().setCustomId("images").setRequired(false).setMaxValues(10),
    );

  await interaction.showModal(
    new ModalBuilder()
      .setCustomId("patchouli:publish")
      .setTitle("パッチノートを作成")
      .addLabelComponents(targetLabel, categoryLabel, titleLabel, bodyLabel, imagesLabel),
  );
}

export async function receivePatchNotePublishModalSubmit({
  interaction,
  patchNotesApi,
  playersApi,
  webhookClients,
  config,
}: {
  interaction: ModalSubmitInteraction;
  patchNotesApi: PatchNotesApi;
  playersApi: PlayersApi;
  webhookClients: Partial<Record<PatchNoteTarget, WebhookClient>>;
  config: Config;
}) {
  const target = interaction.fields.getStringSelectValues("target")[0] as PatchNoteTarget;
  const category = interaction.fields.getStringSelectValues("category")[0] as PatchNoteCategory;
  const title = interaction.fields.getTextInputValue("title");
  const body = interaction.fields.getTextInputValue("body");
  const attachments = Array.from(interaction.fields.getUploadedFiles("images")?.values() ?? []);

  if (!instanceOfPatchNoteTarget(target)) {
    await interaction.reply({
      content: `❌ Validation error: Invalid target \`${target}\`.`,
    });
    return;
  }

  if (!instanceOfPatchNoteCategory(category)) {
    await interaction.reply({
      content: `❌ Validation error: Invalid category \`${category}\`.`,
    });
    return;
  }

  if (attachments.some((attachment) => !attachment.contentType?.startsWith("image/"))) {
    await interaction.reply({
      content: `❌ Validation error: Only image attachments are allowed.`,
    });
    return;
  }

  if (!checkRole({ config, guildMember: interaction.member, patchNoteTarget: target })) {
    await interaction.reply({
      content: `❌ このサーバーのパッチノートを作成する権限がありません。`,
    });
    return;
  }

  await interaction.deferReply();

  await interaction.editReply({
    content: `🔁 パッチノートを投稿しています...`,
  });

  try {
    const players = await playersApi.listPlayers({ discordId: interaction.user.id });
    const authorId = players.items?.[0]?.id ?? null;

    const images = await Promise.all(
      attachments.map(async (attachment) => {
        const response = await fetch(attachment.url);
        if (!response.ok) {
          throw new Error(
            `Failed to download attachment ${attachment.id}: ${response.status} ${response.statusText}`,
          );
        }

        return new File([await response.blob()], attachment.name, {
          type: attachment.contentType ?? undefined,
        });
      }),
    );

    const patchNote = await patchNotesApi.createPatchNote({
      target,
      category,
      title,
      body,
      authorId,
      images,
    });

    await interaction.editReply({
      content: null,
      embeds: [
        new EmbedBuilder()
          .setTitle(`✅ ${patchNote.title}`)
          .setDescription(patchNote.body)
          .setColor("#caa29a")
          .addFields(
            {
              name: "🛠️ ID",
              value: `\`${patchNote.id}\``,
            },
            {
              name: "🔗️ URL",
              value: `https://www.azisaba.net/patch-notes/${patchNote.id}`,
            },
            {
              name: "📦 サーバー",
              value: patchNoteTargetNames[target],
              inline: true,
            },
            {
              name: "🏷️ カテゴリ",
              value: patchNoteCategoryNames[category],
              inline: true,
            },
          ),
        ...patchNote.imageUrls.map((imageUrl) =>
          new EmbedBuilder().setColor("#caa29a").setImage(imageUrl),
        ),
      ],
    });

    const webhook = webhookClients[target];
    if (webhook) {
      await notify({ webhook, patchNote, author: interaction.user });
    }
  } catch (error) {
    console.error("Failed to create patch note:", error);
    await interaction.editReply({ content: "❌ API error" });
  }
}
