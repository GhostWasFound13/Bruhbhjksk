const Guild= require("../../database/schemas/Guild");

module.exports = {
    name: "disablechannel",
    description: "Disable a channel from being used by the chatbot",
    usage: "+disablechannel <channel>",
    category: "Chatbot",
    requiredArgs: 1,
    execute: async (message, args, bot, prefix) => {
        const channel =
        message.mentions.channels.first() ||
        message.guild.channels.cache.get(args[0]);

        if (!channel)
            return message.channel.sendError({
                title: "Chatbot",
                description: `Please provide a valid channel.`,
            });

        const guild = await Guild.findOne({ guildId: message.guild.id });

        if (guild.chatbot.disabledChannels.includes(channel.id)) return message.channel.sendError({
            title: "Chatbot",
            description: `That channel is already disabled.`,
        });

        
        guild.chatbot.disabledChannels.push(channel.id);

        await guild.save();

        return message.channel.send({
            title: "Chatbot",
            description: `Channel ${channel} has been disabled.`,
        });

    }
}