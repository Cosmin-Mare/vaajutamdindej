import express from "express";
import pg from "pg";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import mysql from "mysql";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const postPhotosPath = "public/images/posts/";

const textAndCoordinates = {
  nume: [65, 160],
  prenume: [65, 182],
  strada: [65, 205],
  numar: [287, 205],
  initialaTatalui: [295, 160],
  cnp: [337, 168],
  email: [364, 194],
  telefon: [365, 220],
  judet: [254, 227],
  localitate: [67, 249],
  doiAni: [325, 415],
};

const pdfDoc = await PDFDocument.load(fs.readFileSync("Formular_donatie.pdf"));
const semnaturaBytes = fs.readFileSync("logo.png");
const image = await pdfDoc.embedPng(semnaturaBytes);
const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
const fontSize = 11;
const pages = pdfDoc.getPages();
const firstPage = pages[0];
let posts = [];
let members = [];
let projects = [];
let max_id = 0;

const pageHeight = firstPage.getHeight();

var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Lucian1998",
  typeCast: function castField(field, useDefaultTypeCasting) {
    // We only want to cast bit fields that have a single-bit in them. If the field
    // has more than one bit, then we cannot assume it is supposed to be a Boolean.
    if (field.type === "BIT" && field.length === 1) {
      var bytes = field.buffer();

      // A Buffer in Node represents a collection of 8-bit unsigned integers.
      // Therefore, our single "bit field" comes back as the bits '0000 0001',
      // which is equivalent to the number 1.
      return bytes[0] === 1;
    }

    return useDefaultTypeCasting();
  },
});

connection.connect(function (err) {
  if (err) throw err;
  connection.query(
    "SELECT * FROM VaAjutamDinDej.posts",
    function (err, result, fields) {
      if (err) throw err;
      posts = result;
      posts.reverse();
      max_id = posts.length;
    }
  );
  connection.query(
    "SELECT * FROM VaAjutamDinDej.members",
    function (err, result, fields) {
      if (err) throw err;
      members = result;
    }
  );
  connection.query(
    "SELECT * FROM VaAjutamDinDej.projects",
    function (err, result, fields) {
      if (err) throw err;
      projects = result;
    }
  );
});
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/despre-noi", (req, res) => {
  let council = [];
  let notCouncil = [];
  for (let i = 0; i < members.length; i++) {
    if (members[i].is_council) {
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

app.post("/cum-pot-ajuta", (req, res) => {
  if (validCNP(req.body.cnp) == false) {
    res.render("ajut.ejs", { cnpInvalid: true });
    return;
  }
  const nume = req.body.nume;
  const prenume = req.body.prenume;
  const email = req.body.email;
  const telefon = req.body.telefon;
  const initiala = req.body.initiala;
  const cnp = req.body.cnp;
  const judet = req.body.judet;
  const localitate = req.body.localitate;
  const strada = req.body.strada;
  const numar = req.body.numar;
  const ani = req.body.an;
  const semnatura = req.body.signature;
  if (semnatura === undefined) {
    res.render("ajut.ejs", { semnaturaInvalida: true });
    return;
  }
  var cnp1 = "";
  for (var i = 0; i < cnp.length; i++) {
    cnp1 += cnp[i] + "    ";
  }
  const data = {
    nume: nume,
    prenume: prenume,
    strada: strada,
    numar: numar,
    initialaTatalui: initiala,
    cnp: cnp1,
    email: email,
    telefon: telefon,
    judet: judet,
    localitate: localitate,
    doiAni: ani == "on" ? "X" : "",
  };
  for (const field of Object.keys(textAndCoordinates)) {
    const [x, y] = textAndCoordinates[field];
    let text = data[field];

    firstPage.drawText(text, {
      x,
      y: pageHeight - y,
      size: fontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
  }

  // Step 1: Decode base64 to binary

  var signature = semnatura.replace(/^data:image\/\w+;base64,/, "");
  var buf = Buffer.from(signature, "base64");
  fs.writeFileSync("image.png", buf, function (err) {
    if (err) throw err;
  });

  var image = pdfDoc.embedPng(fs.readFileSync("image.png")).then((image) => {
    firstPage.drawImage(image, {
      x: 390,
      y: 142,
      width: 150,
      height: 10,
    });
  });
  const pdfBytes = pdfDoc.save().then((pdfBytes) => {
    fs.writeFileSync("public/completat.pdf", pdfBytes);
    res.render("ajut.ejs", { pdf: "/completat.pdf" });
  });
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
  var contents = content.split("\n");
  if (contents.length == 1) {
    contents = content.split("\r");
  }
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
app.get("/sustinatori", (req, res) => {
  res.render("parteneri.ejs");
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

function validCNP(p_cnp) {
  var i = 0,
    year = 0,
    hashResult = 0,
    cnp = [],
    hashTable = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
  if (p_cnp.length !== 13) {
    return false;
  }
  for (i = 0; i < 13; i++) {
    cnp[i] = parseInt(p_cnp.charAt(i), 10);
    if (isNaN(cnp[i])) {
      return false;
    }
    if (i < 12) {
      hashResult = hashResult + cnp[i] * hashTable[i];
    }
  }
  hashResult = hashResult % 11;
  if (hashResult === 10) {
    hashResult = 1;
  }
  year = cnp[1] * 10 + cnp[2];
  switch (cnp[0]) {
    case 1:
    case 2:
      {
        year += 1900;
      }
      break;
    case 3:
    case 4:
      {
        year += 1800;
      }
      break;
    case 5:
    case 6:
      {
        year += 2000;
      }
      break;
    case 7:
    case 8:
    case 9:
      {
        year += 2000;
        if (year > parseInt(new Date().getYear(), 10) - 14) {
          year -= 100;
        }
      }
      break;
    default: {
      return false;
    }
  }
  if (year < 1800 || year > 2099) {
    return false;
  }
  return cnp[12] === hashResult;
}
