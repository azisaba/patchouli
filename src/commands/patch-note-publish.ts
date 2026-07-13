import {
  instanceOfPatchNoteCategory,
  instanceOfPatchNoteTarget,
  PatchNoteCategory,
  PatchNotesApi,
  PatchNoteTarget,
} from "@azisaba/graph";
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
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

import { i18n, localizePatchNoteCategory, localizePatchNoteTarget } from "../utils/i18n";

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

  await interaction.showModal(
    new ModalBuilder()
      .setCustomId("patchouli:publish")
      .setTitle(
        i18n(interaction.locale, {
          [Locale.EnglishUS]: "Publish a patch note",
          [Locale.Japanese]: "パッチノートを作成",
        }),
      )
      .addLabelComponents(targetLabel, categoryLabel, titleLabel, bodyLabel),
  );
}

export async function receivePatchNotePublishModalSubmit(
  interaction: ModalSubmitInteraction,
  api: PatchNotesApi,
) {
  const target = interaction.fields.getStringSelectValues("target")[0] as PatchNoteTarget;
  const category = interaction.fields.getStringSelectValues("category")[0] as PatchNoteCategory;
  const title = interaction.fields.getTextInputValue("title");
  const body = interaction.fields.getTextInputValue("body");

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

  await interaction.deferReply();

  try {
    /* const patchNote = await api.createPatchNote({
      target,
      category,
      title,
      body,
    }); */

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`✅ ${title}`)
          .setDescription(body)
          .setColor("#caa29a")
          .addFields(
            { name: "🛠️ ID", value: "\`a280aeb5-b540-42f8-9f69-4a3bc056f0a1\`" },
            { name: "🔗️ URL", value: `https://www.azisaba.net/patch-notes/` },
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
      ],
    });
  } catch (error) {
    console.error("Failed to create patch note:", error);
    await interaction.editReply({ content: "❌ API error" });
  }
}
