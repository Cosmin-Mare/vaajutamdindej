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
let max_id = 0;
db.query("SELECT * FROM posts ORDER BY id ASC", (err, res) => {
  if (err) {
    console.log(err);
  } else {
    posts = res.rows;
    posts.reverse();
    max_id = posts.length;
  }
  db.end();
});

app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const calculateOrderAmount = (items) => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  return 1400;
};

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
  const post = getPostById(max_id - req.params.id);
  const title = post.title;
  const content = post.content;
  const date = post.date;
  const photos = [];
  const numberOfPhotos = getNumberOfFilesInFolder(postPhotosPath + post.id) - 1;
  for (let i = 0; i < numberOfPhotos; i++) {
    photos.push("/images/posts/" + post.id + "/" + i + ".jpg");
  }
  const thumbnail = "/images/posts/" + post.id + "/thumbnail.jpg";
  const contents = content.split("\n");
  res.render("post.ejs", {
    title: title,
    contents: contents,
    date: date,
    photos: photos,
    thumbnail: thumbnail,
  });
});

app.get("/noutati", (req, res) => {
  res.render("noutati.ejs", { posts: posts });
});

app.get("/proiecte", (req, res) => {
  res.render("proiecte.ejs");
});

app.listen(process.env.PORT || port, "192.168.1.161", () => {
  console.log("Server open on 192.168.1.161:" + port);
});

function getPostById(id) {
  for (let i = 0; i < posts.length; i++) {
    if (posts[i].id == max_id - id) {
      return posts[i];
    }
  }
}

function getNumberOfFilesInFolder(folder) {
  return fs.readdirSync(folder).length;
}
