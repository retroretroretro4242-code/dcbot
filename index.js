require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  StringSelectMenuBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
  REST,
  Routes
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // Bot ID
const GUILD_ID = process.env.GUILD_ID;   // Sunucu ID

// ================= SLASH KOMUT KAYIT =================
const commands = [
  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Destek talebi oluşturur")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log("Slash komut yüklendi.");
})();

// ================= BOT READY =================
client.once("ready", () => {
  console.log(`${client.user.tag} aktif!`);
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async interaction => {

  // /ticket komutu
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "ticket") {

      const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket_menu")
        .setPlaceholder("Kategori seç")
        .addOptions([
          { label: "Başvuru", value: "basvuru" },
          { label: "Yardım", value: "yardim" },
          { label: "Şikayet", value: "sikayet" }
        ]);

      const row = new ActionRowBuilder().addComponents(menu);

      await interaction.reply({
        content: "Ticket kategorisi seç:",
        components: [row],
        ephemeral: true
      });
    }
  }

  // Menü seçimi
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "ticket_menu") {

      const kategori = interaction.values[0];
      const isim = `${kategori}-${interaction.user.username}`;

      const mevcut = interaction.guild.channels.cache.find(c => c.name === isim);
      if (mevcut) {
        return interaction.reply({
          content: "Zaten açık ticketin var!",
          ephemeral: true
        });
      }

      const channel = await interaction.guild.channels.create({
        name: isim,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: ["ViewChannel"] },
          { id: interaction.user.id, allow: ["ViewChannel", "SendMessages"] }
        ]
      });

      const kapatBtn = new ButtonBuilder()
        .setCustomId("ticket_kapat")
        .setLabel("🔒 Ticket Kapat")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(kapatBtn);

      await channel.send({
        content: `🎫 Ticket açıldı (${kategori})\n${interaction.user}`,
        components: [row]
      });

      await interaction.reply({
        content: `Ticket oluşturuldu: ${channel}`,
        ephemeral: true
      });
    }
  }

  // Ticket kapatma
  if (interaction.isButton()) {
    if (interaction.customId === "ticket_kapat") {

      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({
          content: "Bunu sadece yetkililer kapatabilir.",
          ephemeral: true
        });
      }

      await interaction.reply("Ticket 5 saniye içinde kapanacak...");
      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 5000);
    }
  }

});

client.login(TOKEN);
