"use strict";

var express = require("express");
var mongo = require("mongodb");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var http = require("http").Server(app);
var io = require("socket.io")(http);

var cors = require("cors");

var app = express();

//error handling for mongoose
function handleErr() {
  console.log("Error");
}

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use("/public", express.static(process.cwd() + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var db =
  "mongodb://jefferylgraham:passw0rd@ds061258.mlab.com:61258/url-shortener";

var Url = mongoose.model("Url", {
  url: String
});

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl/new", async (req, res) => {
  try {
    var url = new Url(req.body);

    var savedUrl = await url.save();
    console.log("Saved");

    var censored = await Url.findOne({ message: "badword" });

    if (censored) {
      await Url.remove({ _id: censored.id });
    } else {
      io.emit("message", req.body);
    }
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
    return console.error(error);
  } finally {
    console.log("Url post called");
  }
});

mongoose.connect(
  db,
  {
    useMongoClient: true
  },
  err => {
    console.log("Mongo DB Connection", err);
  }
);

app.listen(port, function() {
  console.log("Node.js listening ...");
});
