const http = require("http");

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

// =========================
// CONFIG
// =========================

const TOKEN = process.env.TOKEN;
const PORT = process.env.PORT || 3000;

if (!TOKEN) {
  console.error("❌ Thiếu biến môi trường TOKEN.");
  process.exit(1);
}

// =========================
// RENDER WEB SERVER
// =========================

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("VERIFY BOT đang hoạt động!");
}).listen(PORT, () => {
  console.log(`🌐 Web server đang chạy trên port ${PORT}`);
});

// =========================
// DISCORD CLIENT
// =========================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Lưu tiến trình bấm nút
const progress = new Map();

// =========================
// SLASH COMMAND
// =========================

const verifyCommand = new SlashCommandBuilder()
  .setName("verify")
  .setDescription("Mở bảng xác minh 5 nút")
  .toJSON();

// =========================
// BOT ONLINE
// =========================

client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot đã online: ${client.user.tag}`);

  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);

    await rest.put(
      Routes.applicationCommands(client.user.id),
      {
        body: [verifyCommand]
      }
    );

    console.log("✅ Đã đăng ký /verify");
  } catch (error) {
    console.error("❌ Lỗi đăng ký /verify:", error);
  }
});

// =========================
// INTERACTIONS
// =========================

client.on(Events.InteractionCreate, async (interaction) => {

  // =======================
  // /verify
  // =======================

  if (interaction.isChatInputCommand()) {

    if (interaction.commandName !== "verify") {
      return;
    }

    const row = new ActionRowBuilder().addComponents(

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

    await interaction.reply({
      content:
        "🔐 **XÁC MINH**\n\n" +
        "Bấm **đủ cả 5 nút** bên dưới để nhận role **Verify**.",
      components: [row]
    });

    return;
  }

  // =======================
  // BUTTON
  // =======================

  if (interaction.isButton()) {

    if (!interaction.customId.startsWith("verify_")) {
      return;
    }

    const userId = interaction.user.id;

    // Tạo tiến trình cho user
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

    // =======================
    // TÌM ROLE VERIFY
    // =======================

    const role = interaction.guild.roles.cache.find(
      r => r.name === "Verify"
    );

    if (!role) {

      await interaction.reply({
        content: "❌ Không tìm thấy role **Verify**.",
        ephemeral: true
      });

      return;
    }

    // =======================
    // KIỂM TRA ROLE BOT
    // =======================

    const botMember = interaction.guild.members.me;

    if (!botMember) {

      await interaction.reply({
        content: "❌ Không lấy được thông tin bot trong server.",
        ephemeral: true
      });

      return;
    }

    if (role.position >= botMember.roles.highest.position) {

      await interaction.reply({
        content:
          "❌ Bot không thể cấp role **Verify**.\n\n" +
          "Vào **Cài đặt máy chủ → Vai trò** và kéo role của bot lên **trên Verify**.",
        ephemeral: true
      });

      return;
    }

    // =======================
    // CẤP ROLE
    // =======================

    try {

      await interaction.member.roles.add(role);

      // Xóa tiến trình
      progress.delete(userId);

      await interaction.reply({
        content:
          "🎉 **Xác minh thành công!**\n" +
          "Bạn đã nhận role **Verify**.",
        ephemeral: true
      });

      console.log(
        `✅ Đã cấp Verify cho ${interaction.user.tag}`
      );

    } catch (error) {

      console.error("❌ Lỗi cấp role:", error);

      await interaction.reply({
        content:
          "❌ Không thể cấp role **Verify**.\n" +
          "Hãy kiểm tra quyền **Quản lý vai trò** của bot.",
        ephemeral: true
      });
    }
  }
});

// =========================
// LOGIN
// =========================

client.login(TOKEN);
