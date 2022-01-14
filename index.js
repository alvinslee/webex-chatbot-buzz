const Framework = require('webex-node-bot-framework'); 
const webhook = require('webex-node-bot-framework/webhook');

const faker = require('faker');

const express = require('express');
const app = express();
app.use(express.json());

const config = {
  webhookUrl: process.env.WEBHOOK_URL,
  token: process.env.BOT_ACCESS_TOKEN,
  port: 8080
};

const framework = new Framework(config);
framework.start();

framework.on("initialized", () => {
  console.log('Initialized...')
});

framework.on('spawn', (bot, id, addedBy) => {
  if (!addedBy) {
    console.log(`Spawn: existing bot in space: ${bot.room.title}`);
  } else {
    bot.say('Hi! I\'m Buzz! Need some help during a meeting? Ask me for an "action" or a "thingy".  Don\'t forget you need to mention me in a group space!');
  }
});

let responded = false;

framework.hears(/action/i, (bot) => {
  respond(bot, "Here's an action for you...", faker.company.bs());
  responded = true
});

framework.hears(/thingy/i, (bot) => {
  respond(bot, "Try this thingy...", faker.company.catchPhrase());
  responded = true;
});

framework.hears(/.*/gim, (bot, trigger) => {
  if (!responded) {
    bot.say('Sorry, I don\'t know how to respond to "%s"', trigger.message.text);
  }
  responded = false;
});

app.post('/', webhook(framework));

const server = app.listen(config.port, () => {
  console.log('Listening on port %s', config.port);
});

process.on('SIGINT', () => {
  console.log('Stopping...')
  server.close();
  framework.stop().then(() => process.exit());
});

const respond = (bot, intro, text) => {
  if (process.env.USE_CARDS) { 
    bot.sendCard(generateCard(intro, text), text);
  } else { 
    bot.say(intro, text);
  }
}

const generateCard = (subtitle, text) => {
  return {
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.0",
    body: [
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            width: 2,
            items: [
              {
                type: "TextBlock",
                text: subtitle,
                isSubtle: true,
                size: "medium"
              },
              {
                type: "TextBlock",
                text,
                weight: "bolder",
                size: "large",
                wrap: true
              }
            ]
          }
        ]
      }
    ]
  }
}
