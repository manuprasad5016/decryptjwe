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
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = 3001;

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

//Manu New Cookie API , returns back Cookie
app.get("/getCookie", function (req, res) {
  try {
    console.log('Cookie full-->' + req.headers.cookie);

    var randomNumber = Math.random().toString();
    randomNumber = randomNumber.substring(2, randomNumber.length);
    res.cookie('Manu', randomNumber, { maxAge: 900000, httpOnly: true });
    //req.setHeader('Cookie', ['type=ninja', 'language=javascript']); 
    res.status(200).send(cookie);

  } catch (error) {
    console.error("Error-->" + error);
    res.status(500).send({ error: error });
  }
});
//Manu New Cookie API End

//Manu Decrypt Cookie API , returns back Payload
app.post("/decryptCookie", async function (req, res, next) {
  try {
    const encrypted = req.body.jweEncrypted;
    console.log('encrypted Req-->' + encrypted);

    const pkcs88 = '-----BEGIN PRIVATE KEY-----\n\
                    MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgg3x1HUUL3QkLStXP\n\
                    SVmnD8Dl6xHbsh7y5XuPU92H2kGhRANCAATyTtkjqH8ds9DB3oeVZnHHZDkiTOb7\n\
                    /8DZ4OHx+eFmJq8RvuxAQk5nSsQuew9nYTWMobEJgfqeWkE2xxcNWYc6\n\
                    -----END PRIVATE KEY-----';
    const josePrivateKey = await jose.importPKCS8(pkcs88, 'ES256');

    const { decryptedJwt, jwePayload, nestedJwt, actualPayload } = await decryptFunction(encrypted, josePrivateKey);
    console.log('Decrypted JWT is-->' + JSON.stringify(nestedJwt));

    res.status(200).send(nestedJwt);

    /* ***** FUNCTION TO RETURN STRINGIFY OUTPUT ***** */
    function stringify(json) {
      return JSON.stringify(json, null);
    } 

    /* ***** DECRYPT JWE ***** The JWE is decrypted here. */
    const decryptFunction = async function (jwe, privateKey) {
      const { plaintext, protectedHeader } = await jose.compactDecrypt(jwe, privateKey)
      //console.log('plaintext-->'+plaintext);
      const decryptedJwt = await new TextDecoder().decode(plaintext);
      console.log('decryptedJwt-->' + decryptedJwt);
      const jwtDecoded = await jwt.decode(decryptedJwt, { complete: true });
      //console.log('jwtDecoded-->'+jwtDecoded);
      const nestedJwt = stringify(jwtDecoded);
      console.log('nestedJwt-->' + nestedJwt);
      var actualPayload = '';
      return { decryptedJwt, nestedJwt, actualPayload }
    } 
  }
  catch (error) {
    console.log('decryptCookie Catch-->' + error);
    res.status(500).send({ error: error });
  }
});
//Manu Decrypt Cookie API End

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

app.listen(port, () =>
  console.log(`Decrypt Demo App Client listening on port ${port}!`)
);