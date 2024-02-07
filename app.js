//Manu Decrpt Code Sample

const express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const cors = require("cors");
const colors = require("colors");
const crypto = require("crypto"); 
const fs = require("fs");

const jose = require("jose");
const jwt = require("jsonwebtoken");
const {v4: uuidv4} = require("uuid");

const app = express(); 

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
app.post("/decryptCookie", async function (req, res, next) {
  try { 
	const encrypted = req.body.jweEncrypted;
	console.log('Encrypted OPRP Token-->'+encrypted);
  
 
	/* ***** FUNCTION TO RETURN STRINGIFY OUTPUT ***** */
	function stringify(json) {
	  return JSON.stringify(json,null);
	}
 
  
	/* ***** DECRYPT JWE ***** The JWE is decrypted here. */  
	const decryptFunction = async function(jwe,privateKey){ 
			const { plaintext, protectedHeader } = await jose.compactDecrypt(jwe, privateKey); 
			console.log('plaintext-->'+plaintext);
			const decryptedJwt = await new TextDecoder().decode(plaintext);
			console.log('decryptedJwt Hmm-->'+decryptedJwt);
			const jwtDecoded = await jwt.decode(decryptedJwt,{complete:true});
			console.log('jwtDecoded-->'+jwtDecoded);
			const nestedJwt = stringify(jwtDecoded);
			console.log('nestedJwt-->'+nestedJwt);   
			return nestedJwt;
	}
    
    // Execution of the program
	const api = async function(){ 
	const pkcs88 = '-----BEGIN PRIVATE KEY-----\n\
					MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgg3x1HUUL3QkLStXP\n\
					SVmnD8Dl6xHbsh7y5XuPU92H2kGhRANCAATyTtkjqH8ds9DB3oeVZnHHZDkiTOb7\n\
					/8DZ4OHx+eFmJq8RvuxAQk5nSsQuew9nYTWMobEJgfqeWkE2xxcNWYc6\n\
					-----END PRIVATE KEY-----'; 
	
	const josePrivateKey = await jose.importPKCS8(pkcs88,'ES256'); 
	const nestedJwt = await decryptFunction(encrypted, josePrivateKey);
	console.log('Manu 02-->'+JSON.stringify(nestedJwt)); // log the data for demonstration purpose only
  
    res.status(200).send(nestedJwt); //return personData
    
	}
	api(); 
  } 
  catch (error) {
    console.log("---Decrypt NodeJs Library Error---");
    console.log(''Error Happened-->'+error);
    res.status(500).send({
      error: error,
    });
  } 
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handlers
// print stacktrace on error
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    error: err,
  });
});
