const Discord = require("discord.js");
const numberparse = require("../../utils/numberParse");
const randint = require("../../utils/randint");
module.exports = {
  name: "rob",
  description: "Rob a user.",
  category: "economy",
  usage: "+rob [user]",
  requiredArgs: 1,
  aliases: [],
  execute: async (message, args, bot, prefix) => {
    let user =
      message.mentions.members.first() &&
      message.mentions.members.filter(
        (m) => args[0] && args[0].includes(m.user.id)
      ).size >= 1
        ? message.mentions.members
            .filter((m) => args[0] && args[0].includes(m.user.id))
            .first()
        : false ||
          message.guild.members.cache.get(args[0]) ||
          (args.length > 0 &&
            message.guild.members.cache.find((m) =>
              m.user.username
                .toLowerCase()
                .includes(args.join(" ").toLowerCase())
            )) ||
          message.member;

    user = message.guild.members.cache.get(user.id);

    let config = await bot.economy.getConfig(user);
    if (config.passive) {
      message.replyError({
        msg: message,
        title: "User is passive",
        description: "This user is passive and cannot be robbed.",
      });
      return;
    }

    let author = await bot.economy.getConfig(message.member);
    if (author.passive) {
      message.reply({
        msg: message,
        title: "You are passive",
        description: "You are passive and cannot rob.",
      });
      return;
    }
    let money = config.coinsInWallet;
    if (money <= 0) {
      message.replyError({
        msg: message,
        title: `Robbing ${user.displayName}`,
        description: "That user doesn't have any money.",
      });
      return;
    }

    //Check for padlock

    let loot = ["nothing", "little", "half", "all"];
    let lootTable = [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3];
    const padlock = config.items.find((x) => x.name === "padlock");
    if (padlock) {
      let array = config.items.filter((x) => x.name !== "padlock");
      if (Math.random() > 0.1) {
        if (padlock.amount > 1) {
          padlock.amount--;

          array.push(padlock);
          config.items = array;
          await config.save();
          message.reply({
            msg: message,
            title: `Robbing ${user.displayName}`,
            description:
              "They have a padlock and which you break! Only to find one more!",
          });
          return;
        } else {
          config.items = array;
          await config.save();

          message.reply({
            msg: message,
            title: `Robbing ${user.displayName}`,
            description: "They lost all their padlocks!",
          });
        }
      } else {
        config.items = array;
        await config.save();
        message.reply({
          msg: message,
          title: `Robbing ${user.displayName}`,
          description: "You broke all their padlocks!",
        });
      }
    }

    if (config.items.find((x) => x.name == "luckyclover")) {
      const newInv = config.items.filter((i) => i.name != "luckyclover");
      const bypass = config.items.find((i) => i.name == "luckyclover");
      if (bypass.amount == 1) {
        user.items = newInv;
      } else {
        newInv.push({
          name: "luckyclover",
          amount: bypass.amount - 1,
          description: bypass.description,
        });
        config.items = newInv;
      }

      await config.save();
      lootTable = [1, 1, 2, 2, 2, 2, 3, 3, 3];
    }
    let lootIndex =
      loot[lootTable[Math.floor(Math.random() * lootTable.length)]];

    if (lootIndex == "nothing") {
      message.replyError({
        msg: message,
        title: "LMAO! You failed!",
        description: "You failed to rob the user.",
      });
      return;
    } else if (lootIndex == "little") {
      //Get between 0 and 50% of the money
      let percentage = Math.floor(Math.random() * 50);
      let robbedAmount = Math.floor(money * (percentage / 100));

      config.coinsInWallet -= robbedAmount;
      author.coinsInWallet += robbedAmount;
      await config.save();
      await author.save();
      message.reply({
        msg: message,
        title: `Robbing ${user.displayName}`,
        description: `You robbed ${
          user.displayName
        } and got ${robbedAmount.toLocaleString()} coins. It was ${percentage}% of their money.`,
      });
    } else if (lootIndex == "half") {
      //Get half of the money
      let robbedAmount = Math.floor(money / 2);

      config.coinsInWallet -= robbedAmount;
      author.coinsInWallet += robbedAmount;
      await config.save();
      await author.save();
      message.reply({
        msg: message,
        title: `Robbing ${user.displayName}`,
        description: `You robbed ${
          user.displayName
        } and got ${robbedAmount.toLocaleString()} coins. It was half of their money.`,
      });
    } else if (lootIndex == "all") {
      //Get all the money
      let robbedAmount = money;

      config.coinsInWallet -= robbedAmount;
      author.coinsInWallet += robbedAmount;
      await config.save();
      await author.save();
      message.reply({
        msg: message,
        title: `Robbing ${user.displayName}`,
        description: `You robbed ${
          user.displayName
        } and got ${robbedAmount.toLocaleString()} coins. It was all of their money.`,
      });
    }
  },
};
