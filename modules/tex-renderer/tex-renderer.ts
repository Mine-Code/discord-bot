import { Client, SlashCommandBuilder, Events } from "discord.js";
import * as mj from 'mathjax-node';
import { chromium } from 'playwright';

import { BotModule } from "../generics";
import { Env } from "../../main";

import {
  BASE_COMMAND,
  SUB_COMMAND_HELP,
  SUB_COMMAND_INFO,
  SUB_COMMANDS,
  SUB_COMMAND_RENDER,
  SUB_COMMAND_RENDER_OPTIONS,
  SUB_COMMAND_RENDER_OPTION_MESSAGE,
  WIDTH_ATTR_REGEX,
  HEIGHT_ATTR_REGEX,
} from "./constants";


export class TexRenderer extends BotModule {
  name = "TeX 数式描画システム";
  description = "LaTeXの数式モードの記法で数式を描画できます";
  version = "1.0.0";
  author = "yukikamome316";

  constructor(client: Client, env: Env) {
    super(client, env);
  }

  command() {
    const baseCommands = new SlashCommandBuilder()
      .setName(BASE_COMMAND)
      .setDescription(this.description)
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SUB_COMMAND_HELP)
          .setDescription(SUB_COMMANDS[SUB_COMMAND_HELP])
          )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SUB_COMMAND_INFO)
          .setDescription(SUB_COMMANDS[SUB_COMMAND_INFO])
          )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SUB_COMMAND_RENDER)
          .setDescription(SUB_COMMANDS[SUB_COMMAND_RENDER])
          .addStringOption((option) =>
            option
              .setName(SUB_COMMAND_RENDER_OPTION_MESSAGE)
              .setDescription(
                SUB_COMMAND_RENDER_OPTIONS[SUB_COMMAND_RENDER_OPTION_MESSAGE]
              )
              .setRequired(true)
          )
      )

    return [baseCommands.toJSON()];
  }

  async renderLatex(latex: string): Promise<Buffer> {
    mj.config({
        MathJax: {
            // traditional MathJax configuration
        }
    });
    mj.start();

    const input = { math: latex, format: 'TeX', svg: true };
    const data = await mj.typeset(input);
    if (data.errors) {
        throw new Error(data.errors);
    }
    const svg = data.svg;

    const width = parseFloat(svg.match(WIDTH_ATTR_REGEX)[1]);
    const height = parseFloat(svg.match(HEIGHT_ATTR_REGEX)[1]);

    const scale = 2;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(
        svg
            .replace(WIDTH_ATTR_REGEX, `width="${scaledWidth}ex"`)
            .replace(HEIGHT_ATTR_REGEX, `height="${scaledHeight}ex"`)
    );
    const svgElement = await page.$('svg');
    if (!svgElement) {
        throw new Error('SVG element not found');
    }
    const buffer = await svgElement.screenshot({ type: 'png' });
    await browser.close();
    return buffer;
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
          const text = interaction.options.getString(
            SUB_COMMAND_RENDER_OPTION_MESSAGE
          );

          // なぜか .setRequired(true) を指定してもnullになってしまったらエラーを返す
          if (!text) {
            await interaction.reply({
              content: "文字列を指定してください",
              ephemeral: true,
            });
            return;
          }

          // 数式を描画する(エラー時はエラーを返す)
          try {
            const buffer = await this.renderLatex(text);
            await interaction.reply({
              files: [buffer],
            });
          } catch (e) {            
            await interaction.reply({
              content: e.toString(),
              ephemeral: true,
            });
            return;
          }

          break;
        }
      }
    });
  }

  help() {
    return `
Base Commands: [ ${BASE_COMMAND} ]
Sub Commands:
${Object.entries(SUB_COMMANDS)
  .map(([subCommand, description]) => `${subCommand}: ${description}`)
  .join("\n")}
`.trim();
  }
}
