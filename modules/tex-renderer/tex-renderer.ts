import { Client, SlashCommandBuilder, Events, ThreadChannel, MessageFlags } from "discord.js";
import { BotModule } from "../generics";
import { isGuildTextChannel } from "../utils";
import { Env } from "../../main";
import { MathJaxRenderer } from "./mathjax-renderer";

import {
  BASE_COMMAND,
  SUB_COMMAND_HELP,
  SUB_COMMAND_INFO,
  SUB_COMMANDS,
  SUB_COMMAND_RENDER,
  SUB_COMMAND_RENDER_OPTIONS,
  SUB_COMMAND_RENDER_OPTION_MESSAGE,
  SUB_COMMAND_RENDER_OPTION_SCALE,
  SCALE_MIN,
  SCALE_MAX,
  SCALE_DEFAULT,
  RENDER_TIMEOUT_MS,
} from "./constants";

export class TexRenderer extends BotModule {
  name = "数式描画システム";
  description = "LaTeX数式を画像として描画します";
  version = "3.0.0";
  author = "yukikamome316";

  private renderer: MathJaxRenderer;

  constructor(client: Client, env: Env) {
    super(client, env);
    this.renderer = new MathJaxRenderer();
  }

  command() {
    const baseCommands = new SlashCommandBuilder()
      .setName(BASE_COMMAND)
      .setDescription(this.description)
      .addSubcommand((subcommand) =>
        subcommand.setName(SUB_COMMAND_HELP).setDescription(SUB_COMMANDS[SUB_COMMAND_HELP]),
      )
      .addSubcommand((subcommand) =>
        subcommand.setName(SUB_COMMAND_INFO).setDescription(SUB_COMMANDS[SUB_COMMAND_INFO]),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SUB_COMMAND_RENDER)
          .setDescription(SUB_COMMANDS[SUB_COMMAND_RENDER])
          .addStringOption((option) =>
            option
              .setName(SUB_COMMAND_RENDER_OPTION_MESSAGE)
              .setDescription(SUB_COMMAND_RENDER_OPTIONS[SUB_COMMAND_RENDER_OPTION_MESSAGE])
              .setRequired(true),
          )
          .addNumberOption((option) =>
            option
              .setName(SUB_COMMAND_RENDER_OPTION_SCALE)
              .setDescription(SUB_COMMAND_RENDER_OPTIONS[SUB_COMMAND_RENDER_OPTION_SCALE])
              .setRequired(false)
              .setMinValue(SCALE_MIN)
              .setMaxValue(SCALE_MAX),
          ),
      );

    return [baseCommands.toJSON()];
  }

  init() {
    this.client.on(Events.InteractionCreate, async (interaction) => {
      // コマンド以外は無視する
      if (!interaction.isChatInputCommand()) return;
      if (!BASE_COMMAND.includes(interaction.commandName)) return;

      const subCommand = interaction.options.getSubcommand();

      switch (subCommand) {
        case SUB_COMMAND_HELP: {
          await interaction.reply({
            content: this.help(),
          });
          break;
        }
        case SUB_COMMAND_INFO: {
          await interaction.reply({
            content: this.info(),
          });
          break;
        }
        case SUB_COMMAND_RENDER: {
          const text = interaction.options.getString(SUB_COMMAND_RENDER_OPTION_MESSAGE);
          const scale =
            interaction.options.getNumber(SUB_COMMAND_RENDER_OPTION_SCALE) ?? SCALE_DEFAULT;

          if (!text) {
            await interaction.reply({
              content: "数式を指定してください",
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          // 構文検証
          const validation = await this.renderer.validateTeX(text);
          if (!validation.valid) {
            await interaction.reply({
              content: `❌ LaTeX 構文エラーが発生しました:\n\`\`\`\n${validation.error}\n\`\`\`\n入力:\n\`\`\`latex\n${text}\n\`\`\``,
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          await interaction.deferReply();
          await this.processRender(interaction, text, scale);
          break;
        }
      }
    });
  }

  private async processRender(interaction: any, text: string, scale: number) {
    let hasTimedOut = false;

    const safeReply = async (reply: { content?: string; files?: any[] }) => {
      if (hasTimedOut) return;

      try {
        await interaction.editReply(reply);
      } catch (error) {
        console.error("Reply failed:", error);
      }
    };

    const timeoutTimer = setTimeout(async () => {
      hasTimedOut = true;
      await safeReply({
        content: `⏰ **タイムアウト**\n処理に${RENDER_TIMEOUT_MS / 1000}秒以上かかったため中断しました。\n\n**入力:**\n\`\`\`latex\n${text}\n\`\`\``,
      });
    }, RENDER_TIMEOUT_MS);

    try {
      // スケールが大きい場合の警告
      if (scale > 3.0) {
        await safeReply({
          content: `⚠️ スケール${scale}は大きすぎる可能性があります。生成に時間がかかったり、ファイルサイズが制限を超える場合があります。`,
        });
      }

      const attachment = await this.renderer.renderTeX(text, { scale });
      clearTimeout(timeoutTimer);

      if (hasTimedOut) return;

      if (attachment) {
        // ファイルサイズをチェック (8MB制限)
        const MAX_FILE_SIZE = 8 * 1024 * 1024;
        const fileBuffer = attachment.attachment as Buffer;

        if (fileBuffer && fileBuffer.length > MAX_FILE_SIZE) {
          const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
          await safeReply({
            content: `❌ **ファイルサイズエラー**\n生成された画像が大きすぎます (${fileSizeMB}MB > 8MB 制限)。scale を小さくしてください (現在: ${scale})\n\n**入力:**\n\`\`\`latex\n${text}\n\`\`\``,
          });
        } else {
          await safeReply({ files: [attachment] });
        }
      } else {
        await safeReply({
          content: `⚠️ **描画エラー**\n画像生成に失敗しました。\n\n**代替表示:**\n\`\`\`latex\n${text}\n\`\`\``,
        });
      }
    } catch (e) {
      clearTimeout(timeoutTimer);
      if (hasTimedOut) return;

      const errorMessage = e instanceof Error ? e.message : String(e);
      await safeReply({
        content: `❌ **システムエラー**\n\`\`\`\n${errorMessage}\n\`\`\`\n\n**入力:**\n\`\`\`latex\n${text}\n\`\`\``,
      });
    }
  }

  help() {
    return `
**数式描画システム v2.0.0**

Base Commands: \`/${BASE_COMMAND}\`

Sub Commands:
${Object.entries(SUB_COMMANDS)
  .map(([subCommand, description]) => `• \`${subCommand}\`: ${description}`)
  .join("\n")}

**使用例:**
\`/${BASE_COMMAND} ${SUB_COMMAND_RENDER} x^2 + y^2 = z^2\`
\`/${BASE_COMMAND} ${SUB_COMMAND_RENDER} \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a} ${SUB_COMMAND_RENDER_OPTION_SCALE}:1.5\`
\`/${BASE_COMMAND} ${SUB_COMMAND_RENDER} \\sum_{i=1}^{n} i^2 = \\frac{n(n+1)(2n+1)}{6} ${SUB_COMMAND_RENDER_OPTION_SCALE}:0.8\`

**スケールオプション:**
• \`${SUB_COMMAND_RENDER_OPTION_SCALE}\`: 画像のサイズ倍率 (${SCALE_MIN}〜${SCALE_MAX})
• デフォルト: ${SCALE_DEFAULT} (標準サイズ)
• 例: \`${SUB_COMMAND_RENDER_OPTION_SCALE}:1.5\` で1.5倍、\`${SUB_COMMAND_RENDER_OPTION_SCALE}:0.7\` で0.7倍
`.trim();
  }

  info() {
    const systemInfo = MathJaxRenderer.getSystemInfo();
    return `
**システム情報**
🔧 レンダラー: ${systemInfo.renderer}

**サポートする記法:**
• 基本的な数式: \`x^2, x_1, \\frac{a}{b}\`
• ギリシャ文字: \`\\alpha, \\beta, \\gamma\`
• 大きな演算子: \`\\sum, \\int, \\prod\`
• ベクトル・行列: \`\\vec{v}, \\begin{matrix}...\`
• 関数: \`\\sin, \\cos, \\log, \\lim\`

その他の記法: https://docs.mathjax.org/en/latest/input/tex/
`.trim();
  }
}
