const http = require("http");

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const PORT = process.env.PORT || 3000;

const VERIFY_CHANNEL_NAME = "nhan-vai-tro";
const VERIFY_ROLE_NAME = "Verify";

if (!TOKEN) {
  console.error("❌ Thiếu TOKEN trong Environment.");
  process.exit(1);
}

// =========================
// Render Web Service
// =========================

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("VERIFY ZENRIX đang hoạt động!");
}).listen(PORT, () => {
  console.log(`🌐 Web server chạy port ${PORT}`);
});

// =========================
// Discord
// =========================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Lưu tiến trình bấm nút
const progress = new Map();

// =========================
// Tạo bảng 5 nút
// =========================

function createVerifyRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("verify_1")
      .setLabel("1")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("verify_2")
      .setLabel("2")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("verify_3")
      .setLabel("3")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("verify_4")
      .setLabel("4")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("verify_5")
      .setLabel("5")
      .setStyle(ButtonStyle.Primary)
  );
}

// =========================
// Bot online
// =========================

client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot đã online: ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {

    const channel = guild.channels.cache.find(
      ch =>
        ch.name === VERIFY_CHANNEL_NAME &&
        ch.isTextBased()
    );

    if (!channel) {
      console.log(
        `❌ Không tìm thấy #${VERIFY_CHANNEL_NAME} trong ${guild.name}`
      );
      continue;
    }

    try {
      await channel.send({
        content:
          "🔐 **XÁC MINH THÀNH VIÊN**\n\n" +
          "Bấm **đủ cả 5 nút** bên dưới để nhận role **Verify**.",
        components: [createVerifyRow()]
      });

      console.log(
        `✅ Đã gửi bảng xác minh vào #${VERIFY_CHANNEL_NAME}`
      );

    } catch (error) {
      console.error(
        `❌ Không thể gửi vào #${VERIFY_CHANNEL_NAME}:`,
        error
      );
    }
  }
});

// =========================
// Nút xác minh
// =========================

client.on(Events.InteractionCreate, async interaction => {

  if (!interaction.isButton()) return;

  if (!interaction.customId.startsWith("verify_")) {
    return;
  }

  const userId = interaction.user.id;

  if (!progress.has(userId)) {
    progress.set(userId, new Set());
  }

  const userProgress = progress.get(userId);

  // Ghi nhận nút
  userProgress.add(interaction.customId);

  const count = userProgress.size;

  // Chưa đủ 5
  if (count < 5) {
    await interaction.reply({
      content: `✅ Đã ghi nhận! Tiến độ: **${count}/5**`,
      ephemeral: true
    });

    return;
  }

  // =========================
  // Tìm role Verify
  // =========================

  const role = interaction.guild.roles.cache.find(
    r => r.name === VERIFY_ROLE_NAME
  );

  if (!role) {
    await interaction.reply({
      content: "❌ Không tìm thấy role **Verify**.",
      ephemeral: true
    });

    return;
  }

  // =========================
  // Kiểm tra quyền bot
  // =========================

  const botMember = interaction.guild.members.me;

  if (!botMember) {
    await interaction.reply({
      content: "❌ Không tìm thấy bot trong server.",
      ephemeral: true
    });

    return;
  }

  if (!botMember.permissions.has("ManageRoles")) {
    await interaction.reply({
      content:
        "❌ Bot chưa có quyền **Quản lý vai trò**.",
      ephemeral: true
    });

    return;
  }

  if (role.position >= botMember.roles.highest.position) {
    await interaction.reply({
      content:
        "❌ Role bot phải nằm **trên role Verify**.",
      ephemeral: true
    });

    return;
  }

  // =========================
  // Cấp Verify
  // =========================

  try {

    await interaction.member.roles.add(role);

    progress.delete(userId);

    await interaction.reply({
      content:
        "🎉 **Xác minh thành công!**\n" +
        "Bạn đã nhận role **Verify**.",
      ephemeral: true
    });

    console.log(
      `✅ ${interaction.user.tag} đã nhận role Verify`
    );

  } catch (error) {

    console.error("❌ Lỗi cấp role:", error);

    await interaction.reply({
      content:
        "❌ Bot không thể cấp role **Verify**.",
      ephemeral: true
    });
  }
});

// =========================
// Login
// =========================

client.login(TOKEN);
