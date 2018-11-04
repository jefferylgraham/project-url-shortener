"use strict";
var { MongooseAutoIncrementID } = require("mongoose-auto-increment-reworked");
var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var dns = require("dns");
var url = require("url");

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

mongoose.connect(
  "mongodb://jefferylgraham:passw0rd@ds151393.mlab.com:51393/url-shortener",
  {
    useMongoClient: true
  }
);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use("/public", express.static(process.cwd() + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var Schema = mongoose.Schema;

var UrlSchema = new Schema({
  url: String,
  url_id: { type: Number }
});

//Implement mongoose auto increment reworked module
const options = {
  field: "url_id", // url_id will have an auto-incrementing value
  incrementBy: 1, // incremented by 2 every time
  nextCount: false, // Not interested in getting the next count - don't add it to the model
  resetCount: false,
  startAt: 1, // Start the counter at 1000
  unique: true // Don't add a unique index
};

MongooseAutoIncrementID.initialise("UrlShortener");

const plugin = new MongooseAutoIncrementID(UrlSchema, "Url", options);

UrlSchema.plugin(MongooseAutoIncrementID.plugin, { modelName: "Url" });

var Url = mongoose.model("Url", UrlSchema);

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl/new", async (req, res) => {
  try {
    var originalUrl = new Url(req.body);

    var host = new URL(originalUrl.url);

    //check to see if url is valid
    var lookup = dns.lookup(host.hostname, async (err, addresses) => {
      //for valid addresses
      if (addresses) {
        //check to see if url is already in db
        var duplicate = await Url.findOne({ url: originalUrl.url });
        if (duplicate) {
          return res.json({
            original_url: req.body.url,
            short_url: duplicate.id
          });
        }

        //if not already in db, save to
        var savedUrl = await originalUrl.save();

        return res.json({
          original_url: req.body.url,
          short_url: originalUrl.id
        });
      }
      //if not valid return invalid json response
      else {
        return res.json({
          error: "invalid"
        });
      }
    });
  } catch (error) {
    res.sendStatus(500);
    return console.error(error);
  } finally {
    console.log("url post called");
  }
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});
