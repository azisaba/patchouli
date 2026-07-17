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
  Locale,
  ModalBuilder,
  ModalSubmitInteraction,
  SlashCommandSubcommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

import { Config } from "../config";
import { i18n, localizePatchNoteCategory, localizePatchNoteTarget } from "../utils/i18n";
import { notifyPublished } from "../utils/notificator";

export function buildPatchNotePublishSubcommand(
  builder: SlashCommandSubcommandBuilder,
): SlashCommandSubcommandBuilder {
  return builder
    .setName("publish")
    .setDescription("Publish a patch note.")
    .setDescriptionLocalization(Locale.Japanese, "パッチノートを作成します。");
}

export async function receivePatchNotePublishSubcommand(interaction: ChatInputCommandInteraction) {
  const targetLabel = new LabelBuilder()
    .setLabel(
      i18n(interaction.locale, {
        [Locale.EnglishUS]: "📦 Target",
        [Locale.Japanese]: "📦 ターゲット",
      }),
    )
    .setDescription(
      i18n(interaction.locale, {
        [Locale.EnglishUS]: "Select a target for this patch note.",
        [Locale.Japanese]: "何についてのパッチノートですか？",
      }),
    )
    .setStringSelectMenuComponent(
      new StringSelectMenuBuilder()
        .setCustomId("target")
        .setOptions(
          Object.values(PatchNoteTarget).map((target) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(localizePatchNoteTarget(interaction.locale, target))
              .setValue(target),
          ),
        ),
    );

  const categoryLabel = new LabelBuilder()
    .setLabel(
      i18n(interaction.locale, {
        [Locale.EnglishUS]: "🏷️ Category",
        [Locale.Japanese]: "🏷️ カテゴリ",
      }),
    )
    .setDescription(
      i18n(interaction.locale, {
        [Locale.EnglishUS]: "Select a category for this patch note.",
        [Locale.Japanese]: "このパッチノートのカテゴリを選択してください。",
      }),
    )
    .setStringSelectMenuComponent(
      new StringSelectMenuBuilder()
        .setCustomId("category")
        .setOptions(
          Object.values(PatchNoteCategory).map((category) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(localizePatchNoteCategory(interaction.locale, category))
              .setValue(category),
          ),
        ),
    );

  const titleLabel = new LabelBuilder()
    .setLabel(
      i18n(interaction.locale, {
        [Locale.EnglishUS]: "✨ Title",
        [Locale.Japanese]: "✨ タイトル",
      }),
    )
    .setDescription(
      i18n(interaction.locale, {
        [Locale.EnglishUS]: "Enter a short summary of this patch note.",
        [Locale.Japanese]: "一言でパッチノートの内容を表してください。",
      }),
    )
    .setTextInputComponent(
      new TextInputBuilder().setCustomId("title").setStyle(TextInputStyle.Short),
    );

  const bodyLabel = new LabelBuilder()
    .setLabel(
      i18n(interaction.locale, {
        [Locale.EnglishUS]: "📝 Body",
        [Locale.Japanese]: "📝 本文",
      }),
    )
    .setDescription(
      i18n(interaction.locale, {
        [Locale.EnglishUS]: "Describe the changes included in this patch note.",
        [Locale.Japanese]: "このパッチノートの詳細を書いてください。",
      }),
    )
    .setTextInputComponent(
      new TextInputBuilder().setCustomId("body").setStyle(TextInputStyle.Paragraph),
    );

  const imagesLabel = new LabelBuilder()
    .setLabel(
      i18n(interaction.locale, {
        [Locale.EnglishUS]: "🎨 Images",
        [Locale.Japanese]: "🎨 画像",
      }),
    )
    .setDescription(
      i18n(interaction.locale, {
        [Locale.EnglishUS]: "Attach up to 10 images to illustrate this patch note (optional).",
        [Locale.Japanese]: "このパッチノートを説明する画像を10枚まで添付できます（任意）。",
      }),
    )
    .setFileUploadComponent(
      new FileUploadBuilder().setCustomId("images").setRequired(false).setMaxValues(10),
    );

  await interaction.showModal(
    new ModalBuilder()
      .setCustomId("patchouli:publish")
      .setTitle(
        i18n(interaction.locale, {
          [Locale.EnglishUS]: "Publish a patch note",
          [Locale.Japanese]: "パッチノートを作成",
        }),
      )
      .addLabelComponents(targetLabel, categoryLabel, titleLabel, bodyLabel, imagesLabel),
  );
}

export async function receivePatchNotePublishModalSubmit(
  interaction: ModalSubmitInteraction,
  patchNotesApi: PatchNotesApi,
  playersApi: PlayersApi,
  config: Config,
) {
  const target = interaction.fields.getStringSelectValues("target")[0] as PatchNoteTarget;
  const category = interaction.fields.getStringSelectValues("category")[0] as PatchNoteCategory;
  const title = interaction.fields.getTextInputValue("title");
  const body = interaction.fields.getTextInputValue("body");
  const attachments = Array.from(interaction.fields.getUploadedFiles("images")?.values() ?? []);

  if (!instanceOfPatchNoteTarget(target)) {
    await interaction.reply({
      content: `❌ Validation error: Invalid target \`${target}\`.`,
      ephemeral: true,
    });
    return;
  }

  if (!instanceOfPatchNoteCategory(category)) {
    await interaction.reply({
      content: `❌ Validation error: Invalid category \`${category}\`.`,
      ephemeral: true,
    });
    return;
  }

  if (attachments.some((attachment) => !attachment.contentType?.startsWith("image/"))) {
    await interaction.reply({
      content: `❌ Validation error: Only image attachments are allowed.`,
      ephemeral: true,
    });
    return;
  }

  const publisherRoleId = config[target]?.roleId;
  const memberRoles = interaction.member.roles;
  if (
    publisherRoleId &&
    !(Array.isArray(memberRoles)
      ? memberRoles.includes(publisherRoleId)
      : memberRoles.cache.has(publisherRoleId))
  ) {
    await interaction.reply({
      content: `❌ You are not allowed to publish patch notes for \`${target}\`.`,
    });
    return;
  }

  await interaction.deferReply();

  try {
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

    const players = await playersApi.listPlayers({
      discordId: interaction.user.id,
    });
    const authorId = players.items[0]?.id ?? null;

    const patchNote = await patchNotesApi.createPatchNote({
      target,
      category,
      title,
      body,
      authorId,
      images,
    });

    await interaction.editReply({
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
              name: i18n(interaction.guildLocale, {
                [Locale.EnglishUS]: "📦 Target",
                [Locale.Japanese]: "📦 対象",
              }),
              value: localizePatchNoteTarget(interaction.guildLocale, target),
              inline: true,
            },
            {
              name: i18n(interaction.guildLocale, {
                [Locale.EnglishUS]: "🏷️ Category",
                [Locale.Japanese]: "🏷️ カテゴリ",
              }),
              value: localizePatchNoteCategory(interaction.guildLocale, category),
              inline: true,
            },
          ),
        ...patchNote.imageUrls.map((imageUrl) =>
          new EmbedBuilder().setColor("#caa29a").setImage(imageUrl),
        ),
      ],
    });

    await notifyPublished({
      client: interaction.client,
      sender: interaction.user,
      config,
      patchNote,
    });
  } catch (error) {
    console.error("Failed to create patch note:", error);
    await interaction.editReply({ content: "❌ API error" });
  }
}
