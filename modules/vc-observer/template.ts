import { EmbedBuilder, GuildMember, VoiceBasedChannel, channelLink } from "discord.js";
import { USER_IMAGE_NOT_FOUND_URL } from "./constants";

export const NOTIFICATION_TEMPLATE = (
  type: "join" | "leave" | "move",
  member: GuildMember,
  channel: VoiceBasedChannel,
  memberCount: number,
) => {
  let title: string;
  let description: string;
  let color: number;
  let displayName = member.displayName;
  let globalName = member.user.globalName;
  let username = member.user.username;

  switch (type) {
    case "join":
      title = `${displayName} がVCに入室しました`;
      description = `→ <#${channel.id}>`;
      color = 0x08ef74;
      break;
    case "leave":
      title = `${displayName} がVCから退出しました`;
      description = `← <#${channel.id}>`;
      color = 0xf10404;
      break;
    case "move":
      title = `${displayName} がVCを移動しました`;
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
      name: `${globalName} (${username})`,
      icon_url: member.displayAvatarURL() ?? USER_IMAGE_NOT_FOUND_URL,
    }
  });
};
