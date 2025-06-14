import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { VCObserver } from "./vc-observer";
import { NOTIFICATION_TEMPLATE } from "./template";
import {
  SUB_COMMAND_HELP,
  SUB_COMMAND_INFO,
  SUB_COMMAND_DISABLE,
  SUB_COMMAND_ENABLE,
  SUB_COMMANDS,
} from "./constants";
import { Events, MessageFlags } from "discord.js";

// Discord.jsのモック
vi.mock("discord.js", async () => {
  const actual = await import("discord.js");

  // ThreadChannelのモッククラス
  const MockThreadChannel = vi.fn();
  MockThreadChannel.prototype = Object.create(Object.prototype);

  return {
    ...actual,
    Client: vi.fn(),
    SlashCommandBuilder: vi.fn().mockImplementation(() => ({
      setName: vi.fn().mockReturnThis(),
      setDescription: vi.fn().mockReturnThis(),
      addSubcommand: vi.fn().mockReturnThis(),
      toJSON: vi.fn().mockReturnValue({}),
    })),
    SlashCommandSubcommandBuilder: vi.fn().mockImplementation(() => ({
      setName: vi.fn().mockReturnThis(),
      setDescription: vi.fn().mockReturnThis(),
    })),
    ThreadChannel: MockThreadChannel,
    Events: {
      VoiceStateUpdate: "voiceStateUpdate",
      InteractionCreate: "interactionCreate",
    },
    MessageFlags: {
      Ephemeral: 64,
    },
  };
});

// テンプレートのモック
vi.mock("./template", () => ({
  NOTIFICATION_TEMPLATE: vi.fn().mockReturnValue({
    title: "テストタイトル",
    description: "テスト説明",
    color: 0xffffff,
  }),
}));

vi.mock("../utils", () => {
  const mockIsGuildTextChannel = vi.fn((channel) => {
    // mockChannelに対してはtrueを返す
    return channel && channel.id === "test-channel-id";
  });

  return {
    isGuildTextChannel: mockIsGuildTextChannel,
  };
});

describe("VCObserver", () => {
  let vcObserver: VCObserver;
  let mockClient: any;
  let mockEnv: any;
  let mockChannel: any;
  let mockGuildMember: any;
  let mockVoiceChannel: any;
  let mockInteraction: any;

  beforeEach(() => {
    // モックのリセット
    vi.clearAllMocks();

    // クライアントのモック
    mockClient = {
      on: vi.fn(),
      channels: {
        cache: {
          get: vi.fn(),
        },
      },
    };

    // 環境変数のモック
    mockEnv = {
      BOT_TOKEN: "test-token",
      BOT_ID: "test-bot-id",
      GUILD_ID: "test-guild-id",
      OBSERVER_CHANNEL_ID: "test-observer-channel-id",
    };

    // チャンネルのモック
    const MockThreadChannel = vi.fn();
    mockChannel = Object.create(MockThreadChannel.prototype);
    mockChannel.send = vi.fn();
    mockChannel.id = "test-channel-id";

    // ギルドメンバーのモック
    mockGuildMember = {
      displayName: "TestUser",
      user: {
        globalName: "TestGlobalName",
        username: "testusername",
      },
      displayAvatarURL: vi.fn().mockReturnValue("https://example.com/avatar.jpg"),
    };

    // ボイスチャンネルのモック
    mockVoiceChannel = {
      id: "test-voice-channel-id",
      members: {
        size: 3,
      },
    };

    // インタラクションのモック
    mockInteraction = {
      isCommand: vi.fn().mockReturnValue(true),
      isChatInputCommand: vi.fn().mockReturnValue(true),
      inGuild: vi.fn().mockReturnValue(true),
      commandName: "vco",
      options: {
        getSubcommand: vi.fn(),
      },
      reply: vi.fn(),
    };

    // モッククライアントのチャンネルキャッシュ設定
    mockClient.channels.cache.get.mockReturnValue(mockChannel);

    vcObserver = new VCObserver(mockClient, mockEnv);
  });

  describe("基本プロパティ", () => {
    it("正しいモジュール情報を持つ", () => {
      expect(vcObserver.name).toBe("VC監視システム");
      expect(vcObserver.description).toBe("VCの通知を行うシステム");
      expect(vcObserver.version).toBe("1.0.0");
      expect(vcObserver.author).toBe("yukikamome316");
    });
  });

  describe("command()", () => {
    it("正しいコマンド構造を返す", () => {
      const commands = vcObserver.command();
      expect(commands).toBeDefined();
      expect(Array.isArray(commands)).toBe(true);
    });
  });

  describe("help()", () => {
    it("正しいヘルプメッセージを返す", () => {
      const helpMessage = vcObserver.help();

      expect(helpMessage).toContain("Base Commands:");
      expect(helpMessage).toContain("/vco");
      expect(helpMessage).toContain("Sub Commands:");

      // 各サブコマンドが含まれていることを確認
      Object.entries(SUB_COMMANDS).forEach(([subCommand, description]) => {
        expect(helpMessage).toContain(`${subCommand}: ${description}`);
      });
    });
  });

  describe("init() - VoiceStateUpdate events", () => {
    beforeEach(() => {
      vcObserver.init();
    });

    it("VoiceStateUpdateイベントのリスナーが登録される", () => {
      expect(mockClient.on).toHaveBeenCalledWith(Events.VoiceStateUpdate, expect.any(Function));
    });

    it("ユーザーがVCに参加した時に通知が送信される", () => {
      const [eventName, handler] = mockClient.on.mock.calls.find(
        ([event]: [string, any]) => event === Events.VoiceStateUpdate,
      );

      const oldState = {
        channel: null,
        member: null,
      };

      const newState = {
        channel: mockVoiceChannel,
        member: mockGuildMember,
      };

      handler(oldState, newState);

      expect(mockChannel.send).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
      });
      expect(NOTIFICATION_TEMPLATE).toHaveBeenCalledWith(
        "join",
        mockGuildMember,
        mockVoiceChannel,
        mockVoiceChannel.members.size,
      );
    });

    it("ユーザーがVCから退出した時に通知が送信される", () => {
      const [eventName, handler] = mockClient.on.mock.calls.find(
        ([event]: [string, any]) => event === Events.VoiceStateUpdate,
      );

      const oldState = {
        channel: mockVoiceChannel,
        member: mockGuildMember,
      };

      const newState = {
        channel: null,
        member: null,
      };

      handler(oldState, newState);

      expect(mockChannel.send).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
      });
      expect(NOTIFICATION_TEMPLATE).toHaveBeenCalledWith(
        "leave",
        mockGuildMember,
        mockVoiceChannel,
        mockVoiceChannel.members.size,
      );
    });

    it("ユーザーがVCを移動した時に通知が送信される", () => {
      const [eventName, handler] = mockClient.on.mock.calls.find(
        ([event]: [string, any]) => event === Events.VoiceStateUpdate,
      );

      const oldVoiceChannel = {
        id: "old-voice-channel-id",
        members: { size: 2 },
      };

      const newVoiceChannel = {
        id: "new-voice-channel-id",
        members: { size: 4 },
      };

      const oldState = {
        channel: oldVoiceChannel,
        member: mockGuildMember,
      };

      const newState = {
        channel: newVoiceChannel,
        member: mockGuildMember,
      };

      handler(oldState, newState);

      expect(mockChannel.send).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
      });
      expect(NOTIFICATION_TEMPLATE).toHaveBeenCalledWith(
        "move",
        mockGuildMember,
        newVoiceChannel,
        newVoiceChannel.members.size,
      );
    });

    it("監視が無効化されている場合は通知が送信されない", () => {
      const [eventName, handler] = mockClient.on.mock.calls.find(
        ([event]: [string, any]) => event === Events.VoiceStateUpdate,
      );

      // privateプロパティにアクセスしてenabledを無効化
      (vcObserver as any).enabled = false;

      const oldState = {
        channel: null,
        member: null,
      };

      const newState = {
        channel: mockVoiceChannel,
        member: mockGuildMember,
      };

      handler(oldState, newState);

      expect(mockChannel.send).not.toHaveBeenCalled();
    });

    it("時間帯による通知無効化のテスト", () => {
      const [eventName, handler] = mockClient.on.mock.calls.find(
        ([event]: [string, any]) => event === Events.VoiceStateUpdate,
      );

      // 現在時刻をモック (通知無効化時間帯に設定)
      const mockDate = new Date();
      mockDate.setHours(5); // 4 - 8 時の間
      vi.spyOn(global, "Date").mockImplementation(() => mockDate as any);

      const oldState = {
        channel: null,
        member: null,
      };

      const newState = {
        channel: mockVoiceChannel,
        member: mockGuildMember,
      };

      handler(oldState, newState);

      expect(mockChannel.send).not.toHaveBeenCalled();

      vi.restoreAllMocks();
    });
  });

  describe("init() - InteractionCreate events", () => {
    beforeEach(() => {
      vcObserver.init();
    });

    it("InteractionCreateイベントのリスナーが登録される", () => {
      expect(mockClient.on).toHaveBeenCalledWith(Events.InteractionCreate, expect.any(Function));
    });

    it("helpサブコマンドが正しく処理される", () => {
      const [eventName, handler] = mockClient.on.mock.calls.find(
        ([event]: [string, any]) => event === Events.InteractionCreate,
      );

      mockInteraction.options.getSubcommand.mockReturnValue(SUB_COMMAND_HELP);

      handler(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: expect.stringContaining("Base Commands:"),
      });
    });

    it("infoサブコマンドが正しく処理される", () => {
      const [eventName, handler] = mockClient.on.mock.calls.find(
        ([event]: [string, any]) => event === Events.InteractionCreate,
      );

      mockInteraction.options.getSubcommand.mockReturnValue(SUB_COMMAND_INFO);

      handler(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: expect.stringContaining("Name: VC監視システム"),
        flags: MessageFlags.Ephemeral,
      });
    });

    it("disableサブコマンドが正しく処理される", () => {
      const [eventName, handler] = mockClient.on.mock.calls.find(
        ([event]: [string, any]) => event === Events.InteractionCreate,
      );

      mockInteraction.options.getSubcommand.mockReturnValue(SUB_COMMAND_DISABLE);

      handler(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: "監視を停止しました",
        flags: MessageFlags.Ephemeral,
      });

      // enabled状態が変更されることを確認
      expect((vcObserver as any).enabled).toBe(false);
    });

    it("enableサブコマンドが正しく処理される", () => {
      const [eventName, handler] = mockClient.on.mock.calls.find(
        ([event]: [string, any]) => event === Events.InteractionCreate,
      );

      // 最初に無効化
      (vcObserver as any).enabled = false;

      mockInteraction.options.getSubcommand.mockReturnValue(SUB_COMMAND_ENABLE);

      handler(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: "監視を再開しました",
        flags: MessageFlags.Ephemeral,
      });

      // enabled状態が変更されることを確認
      expect((vcObserver as any).enabled).toBe(true);
    });

    it("対象外のコマンドは処理されない", () => {
      const [eventName, handler] = mockClient.on.mock.calls.find(
        ([event]: [string, any]) => event === Events.InteractionCreate,
      );

      mockInteraction.commandName = "other-command";

      handler(mockInteraction);

      expect(mockInteraction.reply).not.toHaveBeenCalled();
    });

    it("チャットコマンド以外のインタラクションは処理されない", () => {
      const [eventName, handler] = mockClient.on.mock.calls.find(
        ([event]: [string, any]) => event === Events.InteractionCreate,
      );

      mockInteraction.isChatInputCommand.mockReturnValue(false);

      handler(mockInteraction);

      expect(mockInteraction.reply).not.toHaveBeenCalled();
    });

    it("ギルド外のインタラクションは処理されない", () => {
      const [eventName, handler] = mockClient.on.mock.calls.find(
        ([event]: [string, any]) => event === Events.InteractionCreate,
      );

      mockInteraction.inGuild.mockReturnValue(false);

      handler(mockInteraction);

      expect(mockInteraction.reply).not.toHaveBeenCalled();
    });
  });
});
