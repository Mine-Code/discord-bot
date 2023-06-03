export const BASE_COMMAND = "system";

export const SUB_COMMAND_PING_OPTION_MESSAGE = "ephemeral";
export const SUB_COMMAND_PING_OPTIONS = {
  [SUB_COMMAND_PING_OPTION_MESSAGE]: "個人的に送信するかどうか",
};

export const SUB_COMMAND_HELP = "help";
export const SUB_COMMAND_INFO = "info";
export const SUB_COMMAND_PING = "ping";

export const SUB_COMMANDS = {
  [SUB_COMMAND_HELP]: "システムコントローラーのヘルプを表示する",
  [SUB_COMMAND_INFO]: "システムコントローラーの情報を表示する",
  [SUB_COMMAND_PING]: "テストメッセージを表示する"
};
