const { Message, MessagePayload } = require("discord.js");
const resources = require("../utils/resources");
module.exports.run = () => {
  Message.prototype.reply = function (options) {
    if (!this.channel) return Promise.reject(new Error("CHANNEL_NOT_CACHED"));
    options.msg = this;
    options = resources.success.embed(options);
    let data;

    if (options instanceof MessagePayload) {
      data = options;
    } else {
      data = options;
      data.reply = {
        messageReference: this,
        failIfNotExists:
          options?.failIfNotExists ?? this.client.options.failIfNotExists,
      };
    }
    return this.channel.send(data);
  };
};
