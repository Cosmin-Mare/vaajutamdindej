import express from "express";

const app = express();
const port = 3000;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.listen(process.env.PORT || port, "192.168.1.161", () => {
  console.log("Server open on port " + port);
});
