const Logging = require("../../database/schemas/logging.js");
const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "clear",
  description: "Delete the specified amount of messages",
  usage: "+clear [channel(optional)] [user(optional)] <message-count> [reason]",
  category: "moderation",
  requiredArgs: 1,
  permission: ["MANAGE_MESSAGES"],
  botPermission: ["MANAGE_MESSAGES"],
  aliases: ["purge"],
  execute: async (message, args, bot, prefix) => {
    const logging = await Logging.findOne({ guildId: message.guild.id });
    let channel =
      message.mentions.channels.first() ||
      message.guild.channels.cache.get(args[0]);

    if (channel) args.shift();
    else channel = message.channel;

    if (!channel.isText() || channel.viewable)
      return message.replyError({
        title: `PURGE`,
        description: `Either I cannot see that channel or it is not a text channel`,
      });

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);

    if (member) args.shift();

    let count = parseInt(args[0]);

    if (isNaN(amount) === true || !amount || amount < 0 || amount > 100)
      return message.replyError({
        title: `PURGE`,
        description: `The provided amount is not valid. The amount must be between 0 and 100`,
      });

    if (!channel.permissionsFor(message.guild.me).has(["MANAGE_MESSAGES"]))
      return message.replyError({
        title: `PURGE`,
        description: `I do not have permission to delete messages in this channel`,
      });

    let reason = args.slice(1).join(" ");
    if (!reason) reason = "None";
    if (reason.length > 1024) reason = reason.slice(0, 1021) + "...";

    await message.delete();

    let messages;
    if (member) {
      messages = (await channel.messages.fetch({ limit: amount })).filter(
        (m) => m.member.id === member.id
      );
    } else messages = amount;

    if (messages.size === 0)
      return message.replyError({
        title: `PURGE`,
        description: `There are no messages to delete from ${member} in ${channel}`,
      });

    channel.bulkDelete(messages, true).then((messages) => {
      message.channel
        .send({
          title: `PURGE`,
          description: `Successfully deleted ${
            messages.size
          } messages in ${channel}. \n ${
            logging && logging.moderation.include_reason === "true"
              ? `\n\n**Reason:** ${reason}`
              : ``
          }`,
        })
        .then((s) => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(() => {
              s.delete().catch(() => {});
            }, 5000);
          }
        });

      const fields = {
        Channel: channel,
      };

      if (member) {
        fields["Member"] = member;
        fields["Messages"] = `\`${messages.size}\``;
      } else fields["Message Count"] = `\`${amount}\``;

      if (logging) {
        if (logging.moderation.delete_after_executed === "true") {
          message.delete().catch(() => {});
        }

        const role = message.guild.roles.cache.get(
          logging.moderation.ignore_role
        );
        const channel = message.guild.channels.cache.get(
          logging.moderation.channel
        );

        if (logging.moderation.toggle == "true") {
          if (channel) {
            if (message.channel.id !== logging.moderation.ignore_channel) {
              if (
                !role ||
                (role &&
                  !message.member.roles.cache.find(
                    (r) => r.name.toLowerCase() === role.name
                  ))
              ) {
                if (logging.moderation.purge == "true") {
                  let color = logging.moderation.color;
                  if (color == "#000000") color = message.guild.me.displayHexColor;

                  let logcase = logging.moderation.caseN;
                  if (!logcase) logcase = `1`;

                  const logEmbed = new MessageEmbed()
                    .setAuthor(
                      `Action: \`Purge\` | Case #${logcase}`,
                      message.author.displayAvatarURL({ format: "png" })
                    )
                    .addField("Moderator", message.member, true)
                    .setTimestamp()
                    .setFooter({ text: `Responsible ID: ${message.author.id}` })
                    .setColor(color);

                  for (const field in fields) {
                    logEmbed.addField(field, fields[field], true);
                  }

                  channel.send({ embed: [logEmbed] }).catch(() => {});

                  logging.moderation.caseN = logcase + 1;
                  logging.save().catch(() => {});
                }
              }
            }
          }
        }
      }
    });
  },
};
