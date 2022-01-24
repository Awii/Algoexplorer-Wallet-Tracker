const axios = require("axios");
const fs = require("fs");
const cron = require("node-cron");

const settings = require("./settings");

const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(settings.telegram.token);

function getAssets(url) {
  return axios
    .get(`https://algoindexer.algoexplorerapi.io/v2/accounts/${url}`)
    .then((res) => {
      const assets = res.data.account.assets;
      const assetIds = assets.map((item) => {
        return item["asset-id"];
      });
      return assetIds;
    });
}

function getName(id) {
  return axios
    .get(`https://algoindexer.algoexplorerapi.io/v2/assets/${id}`)
    .then((res) => {
      const asset = res.data.asset;
      return asset.params["unit-name"];
    });
}

function setState(state) {
  fs.writeFileSync("./temp/state.json", JSON.stringify(state));
}

function getState() {
  return JSON.parse(fs.readFileSync("./temp/state.json"));
}

async function sendAlert(assets) {
  const names = await Promise.all(
    assets.map((asset) => {
      return getName(asset);
    })
  );

  let message = names
    .map((e, i) => {
      return `${e}: ${assets[i]}`;
    })
    .join("\n");

  console.log(message);
  bot.sendMessage(settings.telegram.id, message);
}

async function main() {
  const assets = await getAssets(settings.address);

  const state = getState();

  const diff = assets.filter((e) => !state.includes(e));

  if (diff && diff.length) {
    sendAlert(diff);
  }

  await setState(assets);
}

(async () => {
  main();
})();

cron.schedule("* * * * *", () => {
  main();
});
