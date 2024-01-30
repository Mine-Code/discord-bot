import { EmbedBuilder, GuildMember, VoiceBasedChannel, channelLink } from "discord.js";
import { USER_IMAGE_NOT_FOUND_URL } from "./constants";

export const NOTIFICATION_TEMPLATE = (
  type: "join" | "leave" | "move",
  user: GuildMember,
  channel: VoiceBasedChannel,
  memberCount: number,
) => {
  let title: string;
  let description: string;
  let color: number;
  let name = user.displayName;

  switch (type) {
    case "join":
      title = `${name} がVCに入室しました`;
      description = `→ <#${channel.id}>`;
      color = 0x08ef74;
      break;
    case "leave":
      title = `${name} がVCから退出しました`;
      description = `← <#${channel.id}>`;
      color = 0xf10404;
      break;
    case "move":
      title = `${name} がVCを移動しました`;
      description = `→ <#${channel.id}>`;
      color = 0xf1f104;
      break;
  }
  return new EmbedBuilder({
    title,
    description,
    fields: [
      {
        name: "現在の参加人数",
        value: `${memberCount}`,
        inline: true,
      },
    ],
    color,
    timestamp: new Date().toLocaleString(),
    author: {
      name: user.user.username,
      icon_url: user.displayAvatarURL() ?? USER_IMAGE_NOT_FOUND_URL,
    }
  });
};
