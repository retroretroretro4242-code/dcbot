const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require("discord.js");

// TICKET PANEL KOMUTU
client.on("messageCreate", async message => {
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

// BUTON TIKLANINCA
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "ticket_ac") {
    const existing = interaction.guild.channels.cache.find(
      c => c.name === `ticket-${interaction.user.username}`
    );

    if (existing)
      return interaction.reply({
        content: "Zaten açık bir ticketin var!",
        ephemeral: true
      });

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

    channel.send(
      `🎫 Hoş geldin ${interaction.user}, destek ekibi yakında seninle ilgilenecek.`
    );
  }
});
