const redis = require("redis");

const client = redis.createClient({
  password: "WDfQqObOKY4OCXzjdJeD2GurgSyNgtxM",
  socket: {
    host: "redis-12039.c291.ap-southeast-2-1.ec2.cloud.redislabs.com",
    port: 12039,
  },
});

(async () => {
  // Connect to redis server
  await client.connect();
})();

// client.on("connect", () => {
//   console.log("Connecting to redis client...");
// });

// client.on("ready", () => {
//   console.log("Connected to Redis\n--------------------------\n");
// });

client.on("error", (err) => {
  console.log(err.message);
  (async () => {
    // Connect to redis server
    await client.connect();
  })();
});

// client.on("end", () => {
//   console.log("Redis client disconnected\n");
// });

process.on("SIGINT", () => {
  client.quit();
});

module.exports = client;
