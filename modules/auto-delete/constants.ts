export const BASE_COMMAND = "auto-delete";

export const SUB_COMMAND_START_OPTION_MESSAGE = "duration";
export const SUB_COMMAND_START_OPTIONS = {
  [SUB_COMMAND_START_OPTION_MESSAGE]: "送信されたメッセージが残る時間",
};

export const SUB_COMMAND_HELP = "help";
export const SUB_COMMAND_INFO = "info";
export const SUB_COMMAND_START = "start";
export const SUB_COMMAND_STOP = "stop";
export const SUB_COMMAND_LIST = "list";

export const SUB_COMMANDS = {
  [SUB_COMMAND_HELP]: "システムコントローラーのヘルプを表示する",
  [SUB_COMMAND_INFO]: "システムコントローラーの情報を表示する",
  [SUB_COMMAND_START]: "自動削除を開始する",
  [SUB_COMMAND_STOP]: "自動削除を停止する",
  [SUB_COMMAND_LIST]: "自動削除の対象のチャンネルを一覧表示する"
};
