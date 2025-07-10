import {
  Events,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  User,
  TextChannel,
  EmbedBuilder,
  Client,
  SlashCommandBuilder,
  MessageFlags,
  Message,
  PartialMessage,
  GuildEmoji,
  ReactionEmoji,
  ApplicationEmoji,
} from "discord.js";
import { BotModule } from "../generics";
import {
  ReactionForwarderConfig,
  CONFIG,
  BASE_COMMAND,
  SUB_COMMANDS,
  SUB_COMMAND_HELP,
  SUB_COMMAND_INFO,
  SUB_COMMAND_ENABLE,
  SUB_COMMAND_DISABLE,
  EMBED_COLOR,
  EMBED_FALLBACK_MESSAGE,
  EMBED_UNKNOWN_USER,
} from "./constants";
import { Env } from "../../main";

// key: 元のメッセージ ID
// value: 転送されたメッセージID
const forwardedMessages = new Map<string, string>();

export class ReactionForwarder extends BotModule {
  private config: ReactionForwarderConfig = { ...CONFIG };

  name = "リアクション転送システム";
  description = "特定のリアクションが付いたメッセージを指定チャンネルに転送するシステム";
  version = "1.0.0";
  author = "yukikamome316";

  constructor(client: Client, env: Env) {
    super(client, env);
    // 環境変数から設定を上書き
    this.config.forwardTo = process.env.REACTION_FORWARDER_CHANNEL_ID || "";
  }

  command() {
    const baseCommand = new SlashCommandBuilder()
      .setName(BASE_COMMAND)
      .setDescription(this.description)
      .addSubcommand((subcommand) =>
        subcommand.setName(SUB_COMMAND_HELP).setDescription(SUB_COMMANDS[SUB_COMMAND_HELP]),
      )
      .addSubcommand((subcommand) =>
        subcommand.setName(SUB_COMMAND_INFO).setDescription(SUB_COMMANDS[SUB_COMMAND_INFO]),
      )
      .addSubcommand((subcommand) =>
        subcommand.setName(SUB_COMMAND_ENABLE).setDescription(SUB_COMMANDS[SUB_COMMAND_ENABLE]),
      )
      .addSubcommand((subcommand) =>
        subcommand.setName(SUB_COMMAND_DISABLE).setDescription(SUB_COMMANDS[SUB_COMMAND_DISABLE]),
      );

    return [baseCommand.toJSON()];
  }

  init() {
    this.client.on(Events.MessageReactionAdd, (reaction, user) => {
      this.handleReaction(reaction, user);
    });

    this.client.on(Events.MessageReactionRemove, (reaction, user) => {
      this.handleReaction(reaction, user);
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      if (interaction.commandName !== BASE_COMMAND) return;
      if (!interaction.inGuild()) return;

      const subCommand = interaction.options.getSubcommand();

      switch (subCommand) {
        case SUB_COMMAND_HELP:
          await interaction.reply({
            content: this.help(),
          });
          break;
        case SUB_COMMAND_INFO:
          await interaction.reply({
            content: this.info(),
            flags: MessageFlags.Ephemeral,
          });
          break;
        case SUB_COMMAND_ENABLE:
          this.config.enabled = true;
          await interaction.reply({
            content: "リアクション転送を有効にしました",
            flags: MessageFlags.Ephemeral,
          });
          break;
        case SUB_COMMAND_DISABLE:
          this.config.enabled = false;
          await interaction.reply({
            content: "リアクション転送を無効にしました",
            flags: MessageFlags.Ephemeral,
          });
          break;
      }
    });
  }

  private async handleReaction(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
  ) {
    if (!this.config.enabled) return;

    if (!this.config.forwardTo) {
      console.error("Forward channel not configured");
      return;
    }

    // partial reaction オブジェクトの場合は完全な情報を取得
    if (reaction.partial) {
      try {
        reaction = await reaction.fetch();
      } catch (error) {
        console.error("Failed to fetch partial reaction:", error);
        return;
      }
    }

    const { message, emoji } = reaction;
    const emojiIdentifier = emoji.id ?? emoji.name;

    if (!emojiIdentifier || !this.config.reactions.includes(emojiIdentifier)) {
      return;
    }

    // リアクションした人が bot の場合は無視
    if (user.bot) {
      return;
    }

    // 転送先チャンネルのメッセージの場合は無視
    if (message.channel.id === this.config.forwardTo) {
      return;
    }

    // 転送済みメッセージの存在確認
    const alreadyForwardedMessageId = forwardedMessages.get(message.id);

    // 転送済みでなく、リアクションがないメッセージについては処理不要
    if (reaction.count <= 0 && !alreadyForwardedMessageId) {
      return;
    }

    // 転送先チャンネルを取得
    const forwardToChannel = (await message.client.channels.fetch(
      this.config.forwardTo,
    )) as TextChannel;
    if (!forwardToChannel) {
      console.error(`Forward channel with ID ${this.config.forwardTo} not found.`);
      return;
    }

    // リアクションのすべてのユーザーを取得 (投稿者と bot を除外)
    const users = await reaction.users.fetch();
    const relevantUsers = users.filter((u) => u.id !== message.author?.id && !u.bot);
    const count = relevantUsers.size;

    // 閾値未満の場合の処理
    if (count < this.config.threshold) {
      // 転送済みメッセージがない場合は何もしない
      if (!alreadyForwardedMessageId) {
        return;
      }
      // 転送済みメッセージを削除
      await this.deleteForwardedMessage(message.id, alreadyForwardedMessageId, forwardToChannel);
      return;
    }

    // 既に転送済みの場合は何もしない
    if (alreadyForwardedMessageId) {
      return;
    }

    // メッセージを転送
    await this.forwardMessage(message, emoji, count, forwardToChannel);
  }

  private async forwardMessage(
    message: Message | PartialMessage,
    emoji: GuildEmoji | ReactionEmoji | ApplicationEmoji,
    count: number,
    forwardToChannel: TextChannel,
  ) {
    const emojiDisplay = emoji.id ? `<:${emoji.name}:${emoji.id}>` : emoji.name || "unknown";
    const contentMessage = `${emojiDisplay} ${count} | ${message.url}`;

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTimestamp(message.createdAt)
      .setURL(message.url)
      .setAuthor({
        name: message.member?.displayName ?? message.author?.username ?? EMBED_UNKNOWN_USER,
        url: message.url,
        iconURL: message.author?.displayAvatarURL(),
      })
      .setDescription(message.content?.trim() || EMBED_FALLBACK_MESSAGE);

    // 画像が添付されている場合は設定
    if (message.attachments.size > 0) {
      const firstAttachment = message.attachments.first();
      if (firstAttachment?.url) {
        embed.setImage(firstAttachment.url);
      }
    }

    try {
      const forwardedMessage = await forwardToChannel.send({
        content: contentMessage,
        embeds: [embed],
      });
      forwardedMessages.set(message.id, forwardedMessage.id);
    } catch (error) {
      console.error("Failed to forward message:", error);
    }
  }

  private async deleteForwardedMessage(
    messageId: string,
    forwardedMessageId: string,
    forwardToChannel: TextChannel,
  ) {
    try {
      await forwardToChannel.messages.delete(forwardedMessageId);
      forwardedMessages.delete(messageId);
    } catch (error) {
      console.error("Failed to delete forwarded message:", error);
    }
  }

  help() {
    return `
Base Commands: [ /${BASE_COMMAND} ]
Sub Commands:
${Object.entries(SUB_COMMANDS)
  .map(([subCommand, description]) => `${subCommand}: ${description}`)
  .join("\n")}

現在の設定:
- 状態: ${this.config.enabled ? "有効" : "無効"}
- 転送先: ${this.config.forwardTo ? `<#${this.config.forwardTo}>` : "未設定"}
- リアクションの個数: ${this.config.threshold}
- 監視中のリアクション: ${this.config.reactions.map((id) => `<:reaction:${id}>`).join(", ") || "未設定"}
`.trim();
  }
}
