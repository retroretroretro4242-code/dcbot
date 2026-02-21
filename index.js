require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require('discord.js');

// 👉 CLIENT BURADA TANIMLANIR
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`${client.user.tag} aktif!`);
});

// 🎫 TICKET PANEL KOMUTU
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  if (message.content === "!ticketpanel") {
    const button = new ButtonBuilder()
      .setCustomId("ticket_ac")
      .setLabel("🎫 Ticket Aç")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    message.channel.send({
      content: "Destek almak için butona bas:",
      components: [row]
    });
  }
});

// 🎫 BUTON TIKLAMA
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "ticket_ac") {
    const existing = interaction.guild.channels.cache.find(
      c => c.name === `ticket-${interaction.user.username}`
    );

    if (existing) {
      return interaction.reply({
        content: "Zaten açık ticketin var!",
        ephemeral: true
      });
    }

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: ["ViewChannel"] },
        { id: interaction.user.id, allow: ["ViewChannel"] }
      ]
    });

    await interaction.reply({
      content: `Ticket açıldı: ${channel}`,
      ephemeral: true
    });

    channel.send(`🎫 Hoş geldin ${interaction.user}`);
  }
});

// 👉 EN SONDA LOGIN OLUR
client.login(process.env.TOKEN);
