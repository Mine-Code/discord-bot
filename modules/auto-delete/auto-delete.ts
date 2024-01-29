import { Client, SlashCommandBuilder, Events } from "discord.js";

import { BotModule } from "../generics";
import { Env } from "../../main";
import {
  BASE_COMMAND,
  SUB_COMMANDS,
  SUB_COMMAND_START,
  SUB_COMMAND_STOP,
  SUB_COMMAND_LIST,
  SUB_COMMAND_START_OPTIONS,
  SUB_COMMAND_START_OPTION_MESSAGE,
  SUB_COMMAND_HELP,
  SUB_COMMAND_INFO,
} from "./constants";

export class SystemController extends BotModule {
  name = "システムコントローラー";
  description = "Bot全般設定用モジュール";
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
          .setName(SUB_COMMAND_START)
          .setDescription(SUB_COMMANDS[SUB_COMMAND_START])
          .addIntegerOption((option) =>
            option
              .setName(SUB_COMMAND_START_OPTION_MESSAGE)
              .setDescription(
                SUB_COMMAND_START_OPTIONS[SUB_COMMAND_START_OPTION_MESSAGE]
              )
              .setRequired(true)
          )
      )

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
          console.log(this.help());

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
        case SUB_COMMAND_START: {
          const duration = interaction.options.getInteger(
            SUB_COMMAND_START_OPTION_MESSAGE
          );

          if (!duration) {
            await interaction.reply({
              content: `Invalid duration: ${duration}`,
            });
            return;
          }
          
          // TODO: durationのバリデーション()
          const messages = await interaction.channel?.messages.fetch();
          if (!messages) {
            await interaction.reply({
              content: `No messages found.`,
            });
            return;
          }

          // Filter messages that are older than the specified duration
          const messagesToDelete = messages.filter((message) => {
            const elapsedTime = Date.now() - message.createdTimestamp;
            const elapsedMinutes = Math.floor(elapsedTime / 60000);
            return elapsedMinutes >= duration;
          });

          // Delete the filtered messages
          if (messagesToDelete) {
            interaction.channel?.bulkDelete(filtered)
          }

          await interaction.reply({
            content: `Deleted messages older than ${duration} minutes.`,
          });
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
