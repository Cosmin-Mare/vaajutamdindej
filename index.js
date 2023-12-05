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
});

let members = [];
db.query("SELECT * FROM members ORDER BY id ASC ", (err, res) => {
  if (err) {
    console.log(err);
  } else {
    members = res.rows;
  }
});

let projects = [];
db.query("SELECT * FROM projects ORDER BY id ASC ", (err, res) => {
  if (err) {
    console.log(err);
  } else {
    projects = res.rows;
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
  let council = [];
  let notCouncil = [];
  for (let i = 0; i < members.length; i++) {
    if (members[i].is_council == 1) {
      council.push(members[i]);
    } else {
      notCouncil.push(members[i]);
    }
  }
  res.render("despre-noi.ejs", {
    council: council,
    notCouncil: notCouncil,
  });
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

app.get("/noutate/:id", (req, res) => {
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
  let actual = [];
  let recurrent = [];
  let past = [];

  for (let i = 0; i < projects.length; i++) {
    if (projects[i].type == "a") {
      actual.push(projects[i]);
    } else if (projects[i].type == "r") {
      recurrent.push(projects[i]);
    } else {
      past.push(projects[i]);
    }
  }
  res.render("proiecte.ejs", {
    actual: actual,
    recurrent: recurrent,
    past: past,
  });
});

app.get("/proiect/:id", (req, res) => {
  const project = getProjectById(req.params.id);
  const title = project.title;
  const content = project.content;
  const photos = [];
  const numberOfPhotos =
    getNumberOfFilesInFolder("public/images/projects/" + project.id) - 1;
  for (let i = 0; i < numberOfPhotos; i++) {
    photos.push("/images/projects/" + project.id + "/" + i + ".jpg");
  }
  const thumbnail = "/images/projects/" + project.id + "/thumbnail.jpg";
  const contents = content.split("\n");
  res.render("project.ejs", {
    title: title,
    contents: contents,
    photos: photos,
    thumbnail: thumbnail,
  });
});

app.get("/parteneri", (req, res) => {
  res.render("parteneri.ejs");
});
app.get("/contact", (req, res) => {
  res.render("contact.ejs");
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

function getProjectById(id) {
  for (let i = 0; i < projects.length; i++) {
    if (projects[i].id == id) {
      return projects[i];
    }
  }
}

function getNumberOfFilesInFolder(folder) {
  return fs.readdirSync(folder).length;
}
