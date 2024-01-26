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
    /*
    ***** FUNCTION TO RETURN base64 OUTPUT *****
*/
function base64(text) {
  return(Buffer.from(text).toString('base64'))
}

/*
    ***** FUNCTION TO RETURN base64 DECODED OUTPUT *****
*/
function base64Decode(base64Text) {
  return(Buffer.from(base64Text, 'base64').toString('ascii'))
}
/*
    ***** FUNCTION TO RETURN STRINGIFY OUTPUT *****
*/
function stringify(json) {
  return JSON.stringify(json,null);
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
const getJWT = async (iss, sub, kid, aud, text, privateKey, thumbprint) => {

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

    // BASE64 of the payload
    payload: base64(text),

    // Thumbprint of the encryption key
    cnf: {
      jkt: thumbprint
    }
  };

  /*
      ***** CREATE JWT *****
      The JWT is created here to be used for the authentication header.
  */
  const jwtAuth = jwt.sign(payload, caPrivateKey, signOptions);
  const jwtDecoded = jwt.decode(jwtAuth,{complete:true});
  console.log(`Publisher Generated Nested JWT-\n${jwtAuth}\n`);

  return jwtAuth;
};

/*
    ***** CREATE JWE *****
    The JWE is created here.
*/
const encryptFunction = async function(generatedJwt,publicKey){

  const jwe = await new jose.CompactEncrypt(
    new TextEncoder().encode(generatedJwt),
  )
    .setProtectedHeader({ alg: 'ECDH-ES+A256KW', enc: 'A256GCM' })
    .encrypt(publicKey)
  console.log(`Publisher JWE-\n${jwe}\n`)
  return jwe;
}

/*
    ***** DECRYPT JWE *****
    The JWE is decrypted here.
*/
const decryptFunction = async function(jwe,privateKey){

  const { plaintext, protectedHeader } = await jose.compactDecrypt(jwe, privateKey)
  const decryptedJwt = await new TextDecoder().decode(plaintext);

  const jwtDecoded = await jwt.decode(decryptedJwt,{complete:true});
  const nestedJwt = stringify(jwtDecoded);
  const actualPayload = base64Decode(jwtDecoded.payload.payload);

  console.log(`Consumer Decrypted Nested JWT-\n${stringify(jwtDecoded)}\n`);
  console.log(`Consumer Decrypted Actual Payload-\n${actualPayload}\n`);

  return {decryptedJwt, nestedJwt, actualPayload}
}
    
    // Execution of the program
const api = async function(){

  // This is encryption key from Consumer's JWKS endpoint
  const publicEncryptionKey={
    kty: 'EC',
    crv: 'P-256',
    use: 'enc',
    kid: 'apex-example-encrypt',
    x: 'lZU3Ic1QHBE5Ch9YajxQlqPicJL8lemiWfJga13RZrI',
    y: 'ddqibUSW8DiYexc4IUokdPYEcq5UO9grbaj13PkHGhM',
  }

  // Private key belonging to Consumer
  const privateEncryptionKey={
    kty: 'EC',
    crv: 'P-256',
    use: 'enc',
    kid: 'apex-example-encrypt',
    x: 'lZU3Ic1QHBE5Ch9YajxQlqPicJL8lemiWfJga13RZrI',
    y: 'ddqibUSW8DiYexc4IUokdPYEcq5UO9grbaj13PkHGhM',
    d: 'LUiL_tup7W-vapMlu2NpyTtFv73H1zETj-Oyr8UChzY'
  }

  // This is signing key from Publisher's JWKS endpoint
  const publicSigningKey = {
    kty: 'EC',
    crv: 'P-256',
    x: 'usZhq9AL4aC-hkzGCBK3RuJjmxKE6zqEdFyp-tQ8kh4',
    y: 'wHI1r6rQCHQQSAdNxaJDA0Tw5Fq3B-icq-mbMVlLZA4',
    use: 'sig',
    kid: 'apex-example-sign',
    alg: 'ES256',
  };

    // Private key belonging to Publisher
    const privateSigningKey = {
    kty: 'EC',
    crv: 'P-256',
    x: 'usZhq9AL4aC-hkzGCBK3RuJjmxKE6zqEdFyp-tQ8kh4',
    y: 'wHI1r6rQCHQQSAdNxaJDA0Tw5Fq3B-icq-mbMVlLZA4',
    d: 'w55YEByLRumO-Rnsc8jg2_MaYXfEiT_ioFVoGgrCTlg',
    use: 'sig',
    kid: 'apex-example-sign',
    alg: 'ES256',
  };

  // Variables for Publisher to carry out Nested JWT Signing
  const issuer = 'EXAMPLE PUBLISHER ORG-PROJECT TEAM';
  const subject = 'EXAMPLE PUBLISHER ORG-PROJECT TEAM';
  const keyId = publicSigningKey.kid
  const audience = 'https://public.api.gov.sg/agency/api';
  const thumbprint = await jose.calculateJwkThumbprint(publicEncryptionKey);
  const text = `It's a dangerous business, Frodo, going out your door.`;

  // PUBLISHER CREATES NESTED JWT
  // Assuming that the Publisher has already gotten the Consumer's encryption key from JWKS endpoint
  const generatedJwt = await getJWT(issuer, subject, keyId, audience, text, privateSigningKey, thumbprint);

  const josePublicKey = await jose.importJWK(publicEncryptionKey,'ES256')
  const josePrivateKey = await jose.importJWK(privateEncryptionKey,'ES256')

  // PUBLISHER CREATES ENCRYPTED JWE
  const encrypted = await encryptFunction(generatedJwt, josePublicKey);

  // CONSUMER DECRYPTS JWE
  // Do note that validation of Nested JWT and other security measures are not in the sample code
  const {decryptedJwt, jwePayload, nestedJwt, actualPayload} = await decryptFunction(encrypted, josePrivateKey);
 
    api();
   
    console.log(JSON.stringify(actualPayload)); // log the data for demonstration purpose only
    res.status(200).send(personData); //return personData
  } 
  }catch (error) {
    console.log("---MyInfo NodeJs Library Error---".red);
    console.log(error);
    res.status(500).send({
      error: error,
    });
  }
  
});
