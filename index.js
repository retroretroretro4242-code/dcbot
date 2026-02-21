require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

// ================= CONFIG =================

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const STAFF_ROLE = process.env.STAFF_ROLE_ID;
const CATEGORY = process.env.TICKET_CATEGORY_ID;
const LOG_CHANNEL = process.env.LOG_CHANNEL_ID;

// ================= BOT =================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// ================= SLASH COMMANDS =================

const commands = [

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Gelişmiş ticket paneli"),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Kullanıcı banlar")
    .addUserOption(o => o.setName("kullanıcı").setRequired(true)),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Kullanıcı susturur")
    .addUserOption(o => o.setName("kullanıcı").setRequired(true)),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Mesaj temizler")
    .addIntegerOption(o => o.setName("sayı").setRequired(true))

].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log("Slash komutlar yüklendi ✅");
})();

// ================= READY =================

client.once("ready", () => {
  console.log(`🚀 ${client.user.tag} aktif!`);
});

// ================= INTERACTIONS =================

client.on("interactionCreate", async i => {

  // ---------- /ticket ----------

  if (i.isChatInputCommand() && i.commandName === "ticket") {

    const embed = new EmbedBuilder()
      .setTitle("🎫 Destek Paneli")
      .setDescription(
        "Bir kategori seç ve ticket aç.\n\n" +
        "📝 Başvuru\n❓ Yardım\n⚠️ Şikayet"
      )
      .setColor("Blue");

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_menu")
      .setPlaceholder("Kategori seç")
      .addOptions([
        { label: "Başvuru", value: "basvuru", emoji: "📝" },
        { label: "Yardım", value: "yardim", emoji: "❓" },
        { label: "Şikayet", value: "sikayet", emoji: "⚠️" }
      ]);

    await i.reply({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  }

  // ---------- MENU ----------

  if (i.isStringSelectMenu() && i.customId === "ticket_menu") {

    const type = i.values[0];
    const name = `${type}-${i.user.username}`;

    const existing = i.guild.channels.cache.find(c => c.name === name);

    if (existing)
      return i.reply({ content: "Zaten açık ticketin var!", ephemeral: true });

    const channel = await i.guild.channels.create({
      name,
      parent: CATEGORY,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel] },
        { id: STAFF_ROLE, allow: [PermissionFlagsBits.ViewChannel] }
      ]
    });

    const closeBtn = new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("🔒 Ticket Kapat")
      .setStyle(ButtonStyle.Danger);

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎫 Ticket Açıldı")
          .setDescription(`Kategori: **${type}**\n${i.user}`)
          .setColor("Green")
      ],
      components: [new ActionRowBuilder().addComponents(closeBtn)]
    });

    await i.reply({
      content: `Ticket oluşturuldu: ${channel}`,
      ephemeral: true
    });

    const log = i.guild.channels.cache.get(LOG_CHANNEL);
    if (log) log.send(`📂 Ticket açıldı: ${channel}`);
  }

  // ---------- CLOSE ----------

  if (i.isButton() && i.customId === "close_ticket") {

    if (!i.member.roles.cache.has(STAFF_ROLE))
      return i.reply({ content: "Yetkin yok!", ephemeral: true });

    await i.reply("Ticket kapanıyor...");

    const log = i.guild.channels.cache.get(LOG_CHANNEL);
    if (log) log.send(`🔒 Ticket kapandı: ${i.channel.name}`);

    setTimeout(() => i.channel.delete().catch(() => {}), 3000);
  }

  // ---------- MODERATION ----------

  if (i.isChatInputCommand()) {

    if (i.commandName === "ban") {
      if (!i.member.permissions.has(PermissionFlagsBits.BanMembers))
        return i.reply({ content: "Yetkin yok!", ephemeral: true });

      const user = i.options.getUser("kullanıcı");
      await i.guild.members.ban(user);
      i.reply(`🔨 ${user.tag} banlandı.`);
    }

    if (i.commandName === "mute") {
      const user = i.options.getMember("kullanıcı");
      await user.timeout(10 * 60 * 1000);
      i.reply(`🔇 ${user.user.tag} susturuldu.`);
    }

    if (i.commandName === "clear") {
      const n = i.options.getInteger("sayı");
      const msgs = await i.channel.bulkDelete(n);
      i.reply({ content: `🧹 ${msgs.size} mesaj silindi`, ephemeral: true });
    }
  }

});

// ================= CRASH PROTECTION =================

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// ================= LOGIN =================

client.login(TOKEN);
