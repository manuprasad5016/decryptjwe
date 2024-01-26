// DEPENDENCIES
//const jose = require("jose");
//const {v4: uuidv4} = require('uuid');
//const jwt = require('jsonwebtoken');

const express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const cors = require("cors");
const colors = require("colors");
const crypto = require("crypto");
//var MyInfoConnector = require("myinfo-connector-v4-nodejs");
const fs = require("fs");

const jose = require("jose");
const jwt = require("jsonwebtoken");
const {v4: uuidv4} = require("uuid");

const app = express();
const port = 3001;
//const config = require("./config/config.js");
//const connector = new MyInfoConnector(config.MYINFO_CONNECTOR_CONFIG);

//var sessionIdCache = {};

app.use(express.json());
app.use(cors());

app.set("views", path.join(__dirname, "public/views"));
app.set("view engine", "pug");

app.use(express.static("public"));

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(cookieParser());




// Manu Below getPersonData function - call MyInfo Token + Person API
app.post("/getPersonData", async function (req, res, next) {
  try {
console.log('Manu 01');
  
    res.status(200).send('mmmm'); //return personData
  } 
  catch (error) {
    console.log("---MyInfo NodeJs Library Error---");
    console.log(error);
    res.status(500).send({
      error: error,
    });
  }
  
});
