const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require("discord.js");

const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const VERIFY_ROLE_ID = process.env.VERIFY_ROLE_ID;

// Lưu tiến trình người dùng
const FILE = "./data.json";

let data = {};
if (fs.existsSync(FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    data = {};
  }
}

function save() {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

client.once(Events.ClientReady, () => {
  console.log(`Bot đã online: ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {

  // Lệnh /verify
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName !== "verify") return;

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
        "🔐 **XÁC MINH**\n\nBấm **đủ cả 5 nút** bên dưới để nhận role **Verify**.",
      components: [row]
    });

    return;
  }

  // Xử lý 5 nút
  if (interaction.isButton()) {

    if (!interaction.customId.startsWith("verify_")) return;

    const userId = interaction.user.id;

    if (!data[userId]) {
      data[userId] = [];
    }

    const button = interaction.customId;

    // Không cho bấm trùng
    if (!data[userId].includes(button)) {
      data[userId].push(button);
      save();
    }

    const count = data[userId].length;

    // Chưa đủ 5
    if (count < 5) {
      await interaction.reply({
        content: `✅ Đã ghi nhận! Tiến độ: **${count}/5**`,
        ephemeral: true
      });
      return;
    }

    // Đủ 5
    const role = interaction.guild.roles.cache.get(VERIFY_ROLE_ID);

    if (!role) {
      await interaction.reply({
        content: "❌ Không tìm thấy role Verify. Kiểm tra VERIFY_ROLE_ID.",
        ephemeral: true
      });
      return;
    }

    try {
      await interaction.member.roles.add(role);

      await interaction.reply({
        content:
          "🎉 **Xác minh thành công!**\nBạn đã nhận role **Verify**.",
        ephemeral: true
      });

      // Xóa tiến trình để dữ liệu gọn
      delete data[userId];
      save();

    } catch (error) {
      console.error(error);

      await interaction.reply({
        content:
          "❌ Bot không thể cấp role. Hãy kiểm tra role của bot có nằm trên role Verify không.",
        ephemeral: true
      });
    }
  }
});

client.login(TOKEN);