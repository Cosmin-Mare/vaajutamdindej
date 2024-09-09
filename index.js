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
import { google } from "googleapis";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const postPhotosPath = "public/images/posts/";
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

const key =
  "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";

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
    database: "vaajutamdindejdb_2024-09-04T17-01Z",
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
  var Request = tedious.Request;
  var TYPES = tedious.TYPES;

  if (err) {
    console.log(err);
  }

  var request = new Request(
    "Select * from VaAjutamDinDej.posts ORDER BY date DESC",
    function (err) {
      if (err) {
        console.log(err);
      }
    }
  );
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
  let emailAccept = req.body.emailAccept;
  if (
    emailAccept == "on" &&
    email != undefined &&
    email != "" &&
    email != null &&
    email != "undefined" &&
    email != "null"
  ) {
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
        database: "vaajutamdindejdb_2024-09-04T17-01Z",
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
      if (err) {
        console.log(err);
      }
      var Request = tedious.Request;

      var request = new Request(
        "INSERT INTO VaAjutamDinDej.emails (email) VALUES ('" + email + "')",
        function (err) {
          if (err) {
            console.log(err);
          }
        }
      );
      request.on("requestCompleted", function () {
        connection.close();
      });
      connection.execSql(request);
    });
  }
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
            x: 125,
            y: 142,
            width: 150,
            height: 10,
          });
        });
      let pdfBytes = pdfDoc.save().then((pdfBytes) => {
        const name = nume + "_" + prenume + ".pdf";
        fs.writeFileSync("public/" + name, pdfBytes);
        authorize().then((authClient) => {
          uploadFile(authClient, "public/" + name);
        });

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
    photos.push("/images/posts/" + post.id + "/" + i + ".webp");
  }
  let thumbnail = "/images/posts/" + post.id + "/thumbnail.webp";
  let contents = content.split("\\n");
  if (contents.length == 1) {
    contents = content.split("\r");
    if (contents.length == 1) contents = content.split("\n");
  }
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
app.post("/noutati", (req, res) => {
  let email = req.body.email;
  if (
    email != undefined &&
    email != "" &&
    email != null &&
    email != "undefined" &&
    email != "null"
  ) {
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
        database: "vaajutamdindejdb_2024-09-04T17-01Z",
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
      if (err) {
        console.log(err);
      }
      var Request = tedious.Request;

      var request = new Request(
        "INSERT INTO VaAjutamDinDej.emails (email) VALUES ('" + email + "')",
        function (err) {
          if (err) {
            console.log(err);
          }
        }
      );
      request.on("requestCompleted", function () {
        connection.close();
      });
      connection.execSql(request);
    });
  }
  res.render("noutati.ejs", { posts: posts, email: true });
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
    photos.push("/images/projects/" + project.id + "/" + i + ".webp");
  }
  let thumbnail = "/images/projects/" + project.id + "/thumbnail.webp";
  var contents = content.split("\\n");
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

async function authorize() {
  const jwtClient = new google.auth.JWT(
    process.env.CLIENT_EMAIL,
    null,
    "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCfoMHYiLVpzEUW\nP6rHJStcGHC4gzeCXJfw+AEt1cVoJwCXR9LFXUTO2jk6txEaDAzFz282Iiy+5Vr4\neIQ1PSgdOhZbsqsY2ShH14iD05vmAXUXHVjmAqEXYS22CuBkIUDAAWrzz1YSShON\nn4Ro6eqciF7Buu9QeOr2xySFVwcJ9Ri+Z1//3kqcBxU7xlpVBD26Mi0VWvPIJi7q\n7VQk2phnmqqGnwuOrjw1g1+WOW2lZK/5J7MF4Jk78D/IolAALevL5PEv77bTTCMw\nfJTGs6NxgkAJLb5ps/VK3Zw7zwEDyLLvH2RKTOQapcQ85pC8xSa5wikEDcfI6R07\nlIJ7dFNdAgMBAAECggEABnHhIbLzUCA1Md7EMGIpzAAYnPp/RT4jzFDXC1i0La5V\nccYullVbr9ZTtTEq+Zg+88WaQd9DWzm7YIjNHbEoa3Wq7WzbR5eM7sme82OZycGJ\nTrOaoT697km4JL9vq9tD1/y2qr1WRkrDW1ZzbCD1nfhLixrXCrK3GduUd+W5nQc9\n46JEZ9IkBic5RYC3WclzZh0ClbHzPzHqn4qiJ8uRL/0oVgccCum1WEMStw/7ohoi\nmYqVp0S5kPn1x3hEjK9+4cHG9oduNICQwE8gYoIpmpAXrgY9yaFPx8zAuvQfARD6\nSRfrSz4BamPOQOlO8Zk0jfhfhohFTM4R341x5zxs6QKBgQDcqPEnQSeCxvikYFvx\nxZpTQ8SvKqvKBSJ0PWCe+2sRlyvIzdUHljmy+8dKFFMxHFiWueVA0RC6Iw98pX7W\nR0F0YHb4CjiTd9GK8XqD/SiNyN/Ji125Ky5a2swcH2PlXyjmzxRSWdfQ0nEvZMcK\nCoTymeyoBs097/vHKnxV5hA55wKBgQC5MYENx4/m9Q5/GxQGaD/PzUT7n437yqRZ\n+wV7EgyNoS+Tbu0IObBNb9/Jcu6u4qj1eyE9+cINX1uPuLWQ2Z7qPLt/NoMEBFRa\noO5C8GI+zdDhGTNN0aszAF4TMvm4pl4R+L42l4PpQR8KbDFXlpDgzkfpMq1+tr0W\n1DVAcrkIGwKBgD7icp9iRRVTCQcnYuybCOkT1hipi32uSuxflYqZUiEYOOUoK77W\nxCjK8jedZTwIvQJvhfMb4a16Um6OZ4A/nFrDJwR3PTphmjkDqou0+Pq3NXelnRcp\nRDOmSSb2lyyGGwz0FPGHIyci4hjEmqi06MCOt1AHaDRvkQxogjiksRkfAoGBAK29\nj8GJs6uNxCfjE4pfS158yXb3XZEXr9Dq+11WtYg57BR5QM8ysAA2MNEhjmNsKe8D\nsVAffLpm99OCCnT2dWxzxcO3NHsURL8xs9YBB2q8VHaZ2dPsHJ0gfyGr9TQSgLaD\nkpBM3Wh7u89faXsuuoTtgfF5peL3NbaxJ7Rq7MR5AoGBAMhIvaIxX6lmDJ7YDhLX\nMeSMHqJBZG/CUjVVZXWkjX6Ey+Ao6UnfZ2dEvAf8p1zTWexnyFkUMpi2+yjZLuX+\nGAnPVZo16W31QCKD7zYJt47WpPgAK7Az22CRq1zGEFUU/y3cThNa9P3XdyWO6twC\nRoUW9WE3KNkbufOvP5yqpDFk\n-----END PRIVATE KEY-----\n",
    SCOPES
  );
  await jwtClient.authorize();
  return jwtClient;
}

async function uploadFile(authClient, filename) {
  const drive = google.drive({ version: "v3", auth: authClient });

  var parentId = "1ivHDSfvlg1d1Up0QhFerOivH7_6oxzSx"; //some parentId of a folder under which to create the new folder
  var fileMetadata = {
    name: filename.split("/")[1],
    parents: [parentId],
  };
  drive.files
    .create({
      resource: fileMetadata,
      media: {
        body: fs.createReadStream(filename),
        mimeType: "application/pdf",
      },
      fields: "id",
    })
    .then(function (response) {});
}
