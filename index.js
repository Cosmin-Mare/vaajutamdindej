import express from "express";
import pg from "pg";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

const postPhotosPath = "public/images/posts/";

const db = new pg.Client({
  user: "postgres",
  password: "Lucian1998",
  database: "VaAjutamDinDej",
  host: "localhost",
  port: 5432,
});

let posts = [];

db.connect();
db.query("SELECT * FROM posts", (err, res) => {
  if (err) {
    console.log(err);
  } else {
    posts = res.rows;
  }
  db.end();
});

app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/despre-noi", (req, res) => {
  res.render("despre-noi.ejs");
});

app.get("/motive", (req, res) => {
  res.render("motive.ejs");
});

app.get("/donez", (req, res) => {
  res.render("donez.ejs");
});

app.get("/cum-pot-ajuta", (req, res) => {
  res.render("ajut.ejs");
});

app.get("/post/:id", (req, res) => {
  const post = getPostById(req.params.id);
  const title = post.title;
  const content = post.content;
  const date = post.date;
  const photos = [];
  const numberOfPhotos = getNumberOfFilesInFolder(postPhotosPath + post.id);
  for (let i = 0; i < numberOfPhotos; i++) {
    photos.push("/images/posts/" + post.id + "/" + i + ".jpg");
  }
  res.render("post.ejs", {
    title: title,
    content: content,
    date: date,
    photos: photos,
  });
});

app.get("/noutati", (req, res) => {
  res.render("noutati.ejs", { posts: posts });
});

app.listen(process.env.PORT || port, "192.168.1.161", () => {
  console.log("Server open on 192.168.1.161:" + port);
});

function getPostById(id) {
  for (let i = 0; i < posts.length; i++) {
    if (posts[i].id == id) {
      return posts[i];
    }
  }
}

function getNumberOfFilesInFolder(folder) {
  return fs.readdirSync(folder).length;
}
