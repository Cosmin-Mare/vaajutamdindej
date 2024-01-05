import express from "express";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import mysql2 from "mysql2";
import tedious from "tedious";
import dotenv from "dotenv";
import { setTimeout } from "timers/promises";
import { request } from "http";

dotenv.config();

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

let pdfDoc = await PDFDocument.load(fs.readFileSync("Formular_donatie.pdf"));
const semnaturaBytes = fs.readFileSync("logo.png");
const image = await pdfDoc.embedPng(semnaturaBytes);
const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
const fontSize = 11;
let pages = pdfDoc.getPages();
let firstPage = pages[0];
let posts = [];
let members = [];
let projects = [];
let max_id = 0;

const pageHeight = firstPage.getHeight();
var Connection = tedious.Connection;
var AzureConfig = {
  authentication: {
    options: {
      userName: process.env.DB_USER + "@" + process.env.DB_HOST,
      password: process.env.DB_PASSWORD,
    },
    type: "default",
  },
  server: process.env.DB_HOST,
  options: {
    database: "vaajutamdindejdb",
    encrypt: true,
    debug: {
      packet: true,
      data: true,
      payload: true,
      token: true,
      log: true,
    },
  },
};
var connection = new Connection(AzureConfig);
connection.connect();
connection.on("connect", function (err) {
  // If no error, then good to proceed.
  console.log("Connected");
  var Request = tedious.Request;
  var TYPES = tedious.TYPES;

  if (err) {
    console.log(err);
  }

  var request = new Request("Select * from VaAjutamDinDej.posts", function (
    err
  ) {
    if (err) {
      console.log(err);
    }
  });
  posts = [];
  request.on("row", function (columns) {
    let post = {
      id: columns[0].value,
      title: columns[1].value,
      content: columns[2].value,
      date: columns[3].value,
      link: columns[4].value,
    };
    posts.push(post);
  });
  connection.execSql(request);

  var request2 = new Request("Select * from VaAjutamDinDej.members", function (
    err
  ) {
    if (err) {
      console.log(err);
    }
  });
  members = [];
  request2.on("row", function (columns) {
    let member = {
      id: columns[0].value,
      name: columns[1].value,
      status: columns[2].value,
      is_council: bufferToBinary(columns[3].value),
    };
    members.push(member);
  });
  request.on("requestCompleted", function () {
    posts.reverse();
    connection.execSql(request2);
  });

  var request3 = new Request("Select * from VaAjutamDinDej.projects", function (
    err
  ) {
    if (err) {
      console.log(err);
    }
  });
  projects = [];
  request3.on("row", function (columns) {
    let project = {
      id: columns[0].value,
      title: columns[1].value,
      content: columns[2].value,
      type: columns[3].value,
    };
    projects.push(project);
  });

  request3.on("requestCompleted", function () {
    connection.close();
  });
  request2.on("requestCompleted", function () {
    connection.execSql(request3);
  });
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
  let nume = req.body.nume;
  let prenume = req.body.prenume;
  let email = req.body.email;
  let telefon = req.body.telefon;
  let initiala = req.body.initiala;
  let cnp = req.body.cnp;
  let judet = req.body.judet;
  let localitate = req.body.localitate;
  let strada = req.body.strada;
  let numar = req.body.numar;
  let ani = req.body.an;
  let semnatura = req.body.signature;
  if (semnatura === undefined) {
    res.render("ajut.ejs", { semnaturaInvalida: true });
    return;
  }
  pdfDoc = PDFDocument.load(fs.readFileSync("Formular_donatie.pdf")).then(
    function (pdfDoc) {
      pages = pdfDoc.getPages();
      firstPage = pages[0];

      let cnp1 = "";
      for (let i = 0; i < cnp.length; i++) {
        cnp1 += cnp[i] + "    ";
      }
      let data = {
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
      for (let field of Object.keys(textAndCoordinates)) {
        let [x, y] = textAndCoordinates[field];
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

      let signature = semnatura.replace(/^data:image\/\w+;base64,/, "");
      let buf = Buffer.from(signature, "base64");
      fs.writeFileSync("image.png", buf, function (err) {
        if (err) throw err;
      });

      let image = pdfDoc
        .embedPng(fs.readFileSync("image.png"))
        .then((image) => {
          firstPage.drawImage(image, {
            x: 390,
            y: 142,
            width: 150,
            height: 10,
          });
        });
      let pdfBytes = pdfDoc.save().then((pdfBytes) => {
        const name = nume + "_" + prenume + ".pdf";
        fs.writeFileSync("public/" + name, pdfBytes);

        res.render("ajut.ejs", { pdf: "/" + name });
        setTimeout(100, function () {
          fs.unlinkSync("public/" + name);
        });
      });
    }
  );
});

app.get("/noutate/:id", (req, res) => {
  let post = getPostById(max_id - req.params.id);
  let title = post.title;
  let content = post.content;
  let date = post.date;
  let photos = [];
  let numberOfPhotos = getNumberOfFilesInFolder(postPhotosPath + post.id) - 1;
  for (let i = 0; i < numberOfPhotos; i++) {
    photos.push("/images/posts/" + post.id + "/" + i + ".jpg");
  }
  let thumbnail = "/images/posts/" + post.id + "/thumbnail.jpg";
  let contents = content.split("\n");
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
  let project = getProjectById(req.params.id);
  let title = project.title;
  let content = project.content;
  let photos = [];
  let numberOfPhotos =
    getNumberOfFilesInFolder("public/images/projects/" + project.id) - 1;
  for (let i = 0; i < numberOfPhotos; i++) {
    photos.push("/images/projects/" + project.id + "/" + i + ".jpg");
  }
  let thumbnail = "/images/projects/" + project.id + "/thumbnail.jpg";
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

app.get("*", (req, res) => {
  res.render("404.ejs", { url: req.url.split("/")[1] });
});
app.listen(process.env.PORT || port, () => {
  console.log("Running");
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

function bufferToBinary(buffer) {
  return parseInt(buffer.toString("hex"), 16).toString(2) == 1;
}
