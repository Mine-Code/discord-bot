import {
  Client,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  Events,
  TextChannel,
  NewsChannel,
  ThreadChannel,
  MessageFlags,
} from "discord.js";

import { BotModule } from "../generics";
import { isGuildTextChannel } from "../utils";
import { NOTIFICATION_TEMPLATE } from "./template";
import {
  BASE_COMMANDS,
  OBSERVATION_DISABLED_FROM,
  OBSERVATION_DISABLED_TO,
  SUB_COMMANDS,
  SUB_COMMAND_DISABLE,
  SUB_COMMAND_ENABLE,
  SUB_COMMAND_HELP,
  SUB_COMMAND_INFO,
} from "./constants";
import { Env } from "../../main";

const isNotificationDisabled = () => {
  const now = new Date();
  const hour = now.getHours();
  return hour >= OBSERVATION_DISABLED_FROM && hour < OBSERVATION_DISABLED_TO;
};

export class VCObserver extends BotModule {
  private enabled = true;

  name = "VC監視システム";
  description = "VCの通知を行うシステム";
  version = "1.0.0";
  author = "yukikamome316";

  constructor(client: Client, env: Env) {
    super(client, env);
  }

  command() {
    const subCommands = Object.entries(SUB_COMMANDS).map(([subCommand, description]) =>
      new SlashCommandSubcommandBuilder().setName(subCommand).setDescription(description),
    );

    const baseCommands = BASE_COMMANDS.map((baseCommand) =>
      new SlashCommandBuilder().setName(baseCommand).setDescription(this.description),
    );

    subCommands.forEach((subcommand) => {
      baseCommands.forEach((baseCommand) => {
        baseCommand.addSubcommand(subcommand);
      });
    });

    return baseCommands.map((baseCommand) => baseCommand.toJSON());
  }

  init() {
    this.client.on(Events.VoiceStateUpdate, (oldState, newState) => {
      if (!this.enabled || isNotificationDisabled()) return;

      const newUserChannel = newState.channel; // 新たに参加したチャンネル
      const oldUserChannel = oldState.channel; // 退出したチャンネル
      const notifyChannel = this.client.channels.cache.get(this.env.OBSERVER_CHANNEL_ID);

      // 新たにチャンネルに参加した場合
      if (oldUserChannel === null && newUserChannel !== null) {
        if (
          (!isGuildTextChannel(notifyChannel) && !(notifyChannel instanceof ThreadChannel)) ||
          !newState.member
        )
          return;
        notifyChannel.send({
          embeds: [
            NOTIFICATION_TEMPLATE(
              "join",
              newState.member,
              newUserChannel,
              newUserChannel.members.size,
            ),
          ],
        });
        return;
      }

      // チャンネルから退出した場合
      if (oldUserChannel !== null && newUserChannel === null) {
        if (
          (!isGuildTextChannel(notifyChannel) && !(notifyChannel instanceof ThreadChannel)) ||
          !oldState.member
        )
          return;
        notifyChannel.send({
          embeds: [
            NOTIFICATION_TEMPLATE(
              "leave",
              oldState.member,
              oldUserChannel,
              oldUserChannel.members.size,
            ),
          ],
        });
        return;
      }

      // チャンネルを移動した場合
      if (
        oldUserChannel !== null &&
        newUserChannel !== null &&
        oldUserChannel.id !== newUserChannel.id
      ) {
        if (
          (!isGuildTextChannel(notifyChannel) && !(notifyChannel instanceof ThreadChannel)) ||
          !newState.member
        )
          return;
        notifyChannel.send({
          embeds: [
            NOTIFICATION_TEMPLATE(
              "move",
              newState.member,
              newUserChannel,
              newUserChannel.members.size,
            ),
          ],
        });
        return;
      }
    });

    this.client.on(Events.InteractionCreate, (interaction) => {
      if (!interaction.isCommand()) return;
      if (!interaction.isChatInputCommand()) return;
      if (!BASE_COMMANDS.includes(interaction.commandName)) return;
      if (!interaction.inGuild()) return;

      const subCommand = interaction.options.getSubcommand();

      switch (subCommand) {
        case SUB_COMMAND_HELP:
          interaction.reply({
            content: this.help(),
          });
          break;
        case SUB_COMMAND_INFO:
          interaction.reply({
            content: this.info(),
            flags: MessageFlags.Ephemeral,
          });
          break;
        case SUB_COMMAND_DISABLE:
          this.enabled = false;
          interaction.reply({
            content: "監視を停止しました",
            flags: MessageFlags.Ephemeral,
          });
          break;
        case SUB_COMMAND_ENABLE:
          this.enabled = true;
          interaction.reply({
            content: "監視を再開しました",
            flags: MessageFlags.Ephemeral,
          });
          break;
      }
    });
  }

  help() {
    return `
Base Commands: [ ${BASE_COMMANDS.map((baseCommand) => `/${baseCommand}`).join(", ")} ]
Sub Commands:
${Object.entries(SUB_COMMANDS)
  .map(([subCommand, description]) => `${subCommand}: ${description}`)
  .join("\n")}
`.trim();
  }
}
