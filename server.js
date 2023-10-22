const http = require("http");
const app = require("./app");
const debug = require("debug")("node-angular");

const normalizePort = (val) => {
  var port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return val;
  }

  return false;
};

const onError = (error) => {
  if (error.syscall !== "listen") {
    throw errpr;
  }
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + port;
  switch (error.code) {
    case "EACCESS":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const onListening = () => {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + port;
  debug("Listening on " + bind);
};

const port = normalizePort(process.env.PORT || "3000");

process.on("SIGINT", function () {
  console.log("\nShutting down from SIGINT (Ctrl-C/command-C)");
  process.exit(0);
});

app.set("port", port);
const server = http.createServer(app);
server.on("error", onError);
server.on("listening", onListening);

server.listen(port);
