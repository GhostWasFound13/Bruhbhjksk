module.exports = {
    name: "coinflip",
    description: "Flip a coin!",
    aliases: ["flip", "cointoss"],
    usage: "+coinflip",
    execute: async (message, args, bot, prefix) => {
        const m = await message.channel.send({
            title: "Flipping a coin..."
        })

        const sides = ["Heads", "Tails"];

        await m.edit({
            title: "Coin flipped!",
            description: `The coin landed on ${sides[Math.round(Math.random())]}`
        })
    }
}