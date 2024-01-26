
const express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const cors = require("cors");
const colors = require("colors");
const crypto = require("crypto");
var MyInfoConnector = require("myinfo-connector-v4-nodejs");
const fs = require("fs");

const jose = require("jose");
const jwt = require("jsonwebtoken");
const {v4: uuidv4} = require("uuid");

const app = express();
const port = 3001;
const config = require("./config/config.js");
const connector = new MyInfoConnector(config.MYINFO_CONNECTOR_CONFIG);

var sessionIdCache = {};

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

app.get("/", function (req, res) {
  res.sendFile(__dirname + `/public/index.html`);
});

// get the environment variables (app info) from the config
app.get("/getEnv", function (req, res) {
  try {
    if (
      config.APP_CONFIG.DEMO_APP_CLIENT_ID == undefined ||
      config.APP_CONFIG.DEMO_APP_CLIENT_ID == null
    ) {
      res.status(500).send({
        error: "Missing Client ID",
      });
    } else {
      res.status(200).send({
        clientId: config.APP_CONFIG.DEMO_APP_CLIENT_ID,
        redirectUrl: config.APP_CONFIG.DEMO_APP_CALLBACK_URL,
        scope: config.APP_CONFIG.DEMO_APP_SCOPES,
        purpose_id: config.APP_CONFIG.DEMO_APP_PURPOSE_ID,
        authApiUrl: config.APP_CONFIG.MYINFO_API_AUTHORIZE,
        subentity: config.APP_CONFIG.DEMO_APP_SUBENTITY_ID,
      });
    }
  } catch (error) {
    console.log("Error".red, error);
    res.status(500).send({
      error: error,
    });
  }
});

// callback function - directs back to home page
app.get("/callback", function (req, res) {
  res.sendFile(__dirname + `/public/index.html`);
});

//function to read multiple files from a directory
function readFiles(dirname, onFileContent, onError) {
  fs.readdir(dirname, function (err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function (filename) {
      fs.readFile(dirname + filename, "utf8", function (err, content) {
        if (err) {
          onError(err);
          return;
        }
        onFileContent(filename, content);
      });
    });
  });
}

// getPersonData function - call MyInfo Token + Person API
app.post("/getPersonData", async function (req, res, next) {
  try {
    // get variables from frontend
    var authCode = req.body.authCode;
    var codeVerifier;
    if(req.body.Apex == "Apex"){
      codeVerifier = req.body.codeVerifierVar;
    }else{
      //retrieve code verifier from session cache
      codeVerifier = sessionIdCache[req.cookies.sid];
    }
    console.log("Calling MyInfo NodeJs Library...".green);
    console.log("READING FILE: ", path.resolve(__dirname, "./cert/your-sample-app-signing-private-key.pem"));
    // retrieve private siging key and decode to utf8 from FS
    let privateSigningKey = fs.readFileSync(
      path.resolve(__dirname, "./cert/your-sample-app-signing-private-key.pem"),
      "utf8"
    );

    let cert = fs.readFileSync(
      path.resolve(__dirname, "./cert/encryption-private-keys/your-sample-app-encryption-private-key.pem"),
      "utf8"
    );
    //var cert = '-----BEGIN CERTIFICATE-----\n\
    //MHcCAQEEIDr6SLHbruSfQuLOxvc6nAL3w+/Dg9C3pge1aGuZ8rn2oAoGCCqGSM49\n\
    //AwEHoUQDQgAENfIxJudBO1/XD4DnhkVKPonHux0LG12O3D+Z2NfsuEHYcbp7IlwQ\n\
    //QFVlSnViUXnstYyUAibJK43nBBx4Suaj3w==\n\
    //-----END CERTIFICATE-----';
    let privateEncryptionKeys = [];
    privateEncryptionKeys.push(cert);
    // retrieve private encryption keys and decode to utf8 from FS, insert all keys to array
    //readFiles(
    //  path.resolve(__dirname, "./cert/encryption-private-keys/"),
    //  (filename, content) => {
    //    privateEncryptionKeys.push(content);
    //  },
    //  (err) => {
     //   throw err;
     // }
   // );
    console.log("Param 1 -->"+authCode);
    console.log("Param 2 -->"+codeVerifier);
    console.log("Param 3 -->"+privateSigningKey);
    console.log("Param 4 -->"+privateEncryptionKeys);

    //call myinfo connector to retrieve data
    let personData = await connector.getMyInfoPersonData(
      authCode,
      codeVerifier,
      privateSigningKey,
      privateEncryptionKeys
    );

    /* 
      P/s: Your logic to handle the person data ...
    */
    console.log(
      "--- Sending Person Data From Your-Server (Backend) to Your-Client (Frontend)---:"
        .green
    );
    console.log(JSON.stringify(personData)); // log the data for demonstration purpose only
    res.status(200).send(personData); //return personData
  } catch (error) {
    console.log("---MyInfo NodeJs Library Error---".red);
    console.log(error);
    res.status(500).send({
      error: error,
    });
  }
});

// Generate the code verifier and code challenge for PKCE flow
app.post("/generateCodeChallenge", async function (req, res, next) {
  try {
    /*
    FUNCTION TO RETURN STRINGIFY OUTPUT
*/
function stringify(json) {
  return JSON.stringify(json,null);
}
/*
    ***** FUNCTION TO RETURN SHA-256 ENCODING *****
*/
function sha256Hash(string) {
  return crypto.createHash('sha256').update(string).digest('hex');
}

/*
    ***** FUNCTION TO RETURN PRIVATE KEY IN PKCS8 FORMAT *****
*/
const importKey = async(key) => {
  const importedKey = await jose.importJWK(key, 'ES256')
  const privateKeyPKCS8 = await jose.exportPKCS8(importedKey);
  return privateKeyPKCS8;
}

/*
    ***** FUNCTION TO GENERATE JWT ******
*/
const getJWT = async (iss, sub, kid, aud, hash, privateKey) => {

  /*
      ***** GET THE PKCS8 Signing Key *****
      This can be from a file or generated by a JWK in Endian format.
  */
  // const caPrivateKey = fs.readFileSync('./private.key', 'utf8');
  const caPrivateKey = await importKey(privateKey);


  const signOptions = {
    algorithm: 'ES256',
    keyid: kid,
    expiresIn: '180s',
    jwtid: uuidv4(),
    issuer: iss,
    audience: aud,
    subject: sub,
  };
  const payload = {
    data: hash,
  };

  /*
      ***** CREATE JWT *****
      The JWT is created here to be used for the authentication header.
  */
  var jwtAuth = jwt.sign(payload, caPrivateKey, signOptions);
  var jwtDecoded = jwt.decode(jwtAuth,{complete:true});

  console.log(`JWT-\n${jwtAuth}\n`);
  console.log(`Decoded JWT-\n${stringify(jwtDecoded.header)}.${stringify(jwtDecoded.payload)}\n`);

  return jwtAuth;
};

/*
    ***** START OF PROGRAM *****
*/

/*
    ***** DEFINE SIGNING VARIABLES *****
    Here the following JWT claims are defined:
    - issuer : API Key(s) with the format: (1) api-key-1 or (2) api-key-1,api-key2
    - subject
    - key ID
    - audience
    - JSON payload
    - private key
    - payload hash (data)

    The code below contains a sample private key.
    In a real scenario this will be in a secure vault and should not be in program code.
*/
const issuer = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxx,yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyy';
const subject = 'POST';
const keyId = 'apex-example';
const audience = 'https://public-stg.api.gov.sg/agency/api';

const privateKey = {
  kty: 'EC',
  crv: 'P-256',
  x: 'usZhq9AL4aC-hkzGCBK3RuJjmxKE6zqEdFyp-tQ8kh4',
  y: 'wHI1r6rQCHQQSAdNxaJDA0Tw5Fq3B-icq-mbMVlLZA4',
  d: 'w55YEByLRumO-Rnsc8jg2_MaYXfEiT_ioFVoGgrCTlg',
  use: 'sig',
  kid: 'apex-example',
  alg: 'ES256',
};

const payload = {payload: 'data'};
const payloadString = JSON.stringify(payload);
const hash = sha256Hash(payloadString);
console.log(`Payload-\n${payloadString}\n`);
console.log(`Hash-\n${hash}\n`);
    
console.log('One-->');
var gg = await getJWT(issuer, subject, keyId, audience, hash, privateKey);
console.log('Manu-->'+gg);

    
    // call connector to generate code_challenge and code_verifier
    let pkceCodePair = connector.generatePKCECodePair();
    // create a session and store code_challenge and code_verifier pair
    let sessionId = crypto.randomBytes(16).toString("hex");
    sessionIdCache[sessionId] = pkceCodePair.codeVerifier;

    //establish a frontend session with browser to retrieve back code_verifier
    res.cookie("sid", sessionId);
    //send code code_challenge to frontend to make /authorize call
    var responsearray = {
    resultVar: {
      codeChallenge: gg,
      codeVerifier: pkceCodePair.codeVerifier
    }
    };
    //res.status(200).send(pkceCodePair.codeChallenge);
    res.status(200).send(responsearray);
  } catch (error) {
    console.log("Error".red, error);
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

app.listen(port, () =>
  console.log(`Demo App Client listening on port ${port}!`)
);
