const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

// Set environment variable to enable admin portal on this server
process.env.ENABLE_ADMIN_PORTAL = process.env.ENABLE_ADMIN_PORTAL || "true";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3001", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  })
    .once("error", (err) => {
      console.error("Admin Server error:", err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> BGV Fashion Admin Portal Server ready on http://${hostname}:${port}`);
      console.log(`> Environment: ${dev ? "development" : "production"}`);
      console.log(`> Admin Portal Route: http://${hostname}:${port}/admin`);
    });
});
