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
  console.log('MM Headers-->'+JSON.stringify(req.headers)); 
  const cookieHeader = req.headers?.cookie;
  console.log('Cookie-->'+cookieHeader);
  console.log('Cookie full-->'+req.headers.cookie);
  
  var randomNumber=Math.random().toString();
   randomNumber=randomNumber.substring(2,randomNumber.length);
   res.cookie('Manu',randomNumber, { maxAge: 900000, httpOnly: true });
  //req.setHeader('Cookie', ['type=ninja', 'language=javascript']);
  try {
    //Not logged In
    //var cookie = '';
    //Member
    //var cookie = 'eyJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwiYWxnIjoiRUNESC1FUytBMjU2S1ciLCJraWQiOiJXRFMtRU5DUllQVC1PUFJQLURFVi1SUEJST0tFUiIsImVwayI6eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6ImZwcjdTZHpZN0E0ZTVLbGE4QXc5NmlVem80U25BYmpSaFlnOG1rdUdLRjAiLCJ5IjoicDctTzBQeUMxdUJ0VDJIb1Zld0VJV3ljTjNVVmhpeXZOSnAtWng1UnJHdyJ9fQ.cZg49Fx_BqGSEWjpIxxwezaejbTK2Ng5K-8SMD5VHbBfXWceoTUfGSVuDVzt0oyNd4aO8JBDBEmVK6inmZ7WwSo4xCiqbm5K.CTAuEsfOWcTCnUQpzneEVw.94WqwMdj85xJ-1OvyyZ_nT6LBV_x1KFC8yFYtsQYo14c22qWc2WLdJWnmYEypoQcNE1yqVIgnUmiVu_-5_VXVb9NW2RkWdh3IY7ja7bHMrrUc4odndn6nife7X1L3xanSeAIIEdcK-nQ5nvC2c8hEZsP01Ggs3vmxTcXFEPohdHp8qctUL3LztbY5DzOYlJraLZsWhkzmYsKBVIPl3078iy6hT752vjGS6AKdWNPafSWsi3MHLE2CIbBQIY-qeA9yc6o8RohbWn7nnxKA227e583jrA9yRhHy_kqu6cRXbxC-vM2LFPvbGH0JjevK-RoWAAaowuemZG-98b7h6uVdsYFroBBGBaW8mDFUP9p9U7SQJcEACezbEDJMJAAqSec30--MQ52rv3FTqqGlBPbJjIK-km8Y1YR_5o2ggsLwhnvYm6VNlu25l1wY5hyDR15CtO3_J0aYOSGZyWedLPMWhylNmvV8ZX7Kqp6Qo0QqiGxGM5OpWyVIPn9v8Dl-fAU7FQSZuRoevhDRQAlNn2oX-bZuMXfrl7LfDIA5EeGqeg1UTTBlrzgodYTBygpClHHijcpVJsZbUnNkSjxOXRzyiePho9vminXmLhsDlTHfv1I0eeC-a6jOD0380tvxvPUFDzMUvbKaSrfcHLL2p4doc5_vQawvtEUIr8Yk129rRWZDzQO0V_jTUhMlXMq0ABkIBHMGmt3mSHb2Pa7fcmxWgEs1_Geh2dDtLAPmWp-XbLIei6MTMDu0i8v6XYljDfsqz2DWjoGH66GBuVHj5BpTXrSGMaaJRkqx0fauhN789hts4lWNED_MazALDHjPaXWYRYADWgRumhWzozp0LMSgl_ZxEvIwo6ng3nzU7yzqgQ11pdXl87KpU7MZqRFWdx6HfcoXu6Rot03Gg54lmEyNabQXDiYgtnnvKaiYiyJ2jYz-QFeBxIIqGOoJtwb8Ygu_s8L4_Ma04oXCfYXR3inW0Rdwb0DjEk_9g4LrGXm0SeOHT8UVL2QFb6pgk5PzTHWVPb2cI0WgwoH_L2SOxcBbv5U0EjMLBtz4vqQ5gKb5BICYHOBJWRiZkbLNv932qCT1uZsVJWKvqDN4N1tx2Z72GX46gFHlRENAeSxnsZlpCgsYO4r04f3m4g8lEo1eSqESUTzFc3dx8Tjw7-N96zXzp9GZBiNtLpWpNS6qgjOO0_jWg-N8rs6amtFInLR8Zr0I-i9vIcMuSpTq8hbFvglz__NO95TSr-CQpBSPvG5o87TyTp5Vn6rfVOq71JcClCDAZYqIungIB-w03L8a3e-s-oNPM3IFxzAbzsU4JI2OGyBen2B2DwQk5ddZV3e2Rac1p85k3HamQS7bjLyK8rKqULwrSW56pPMMdlTZLJmjtFeTccP2HLY6-wxi0WY4jR6_LVBpV3LH12_UBH7mJ0w13CWCay4ArlKC-e2zomRqH4fMYi42JfHBKK-MN9W4kq9rOZz6mjzsIQWNM36yZGZzkn9mJyZWJE8nXZjR-ZM7h8_lgcP3Untv4m95OHCt-O0k8hpfnIHUpgBqzvf4jBq60Fyot0vaBiktBBODdign5oXKNKMz9MAahoQJ1rfgJxZyAfWWXHudsBF5SYo03k4Bg.UCeO5ssZr8CPpNk8MBO1ovxCPiuQ1MVcgwNVW5f1bbM';
    //Employer
    var cookie = 'eyJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwiYWxnIjoiRUNESC1FUytBMjU2S1ciLCJraWQiOiJXRFMtRU5DUllQVC1PUFJQLURFVi1SUEJST0tFUiIsImVwayI6eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6Ijd1dmpkNXh1bkU5ckFfVXBPcGRPdHhVdDFSUGs5TlFiLUpYdHNTWjhMNnciLCJ5IjoiSmlLS3R6S3J5bEZ2TXM4ejZRLWRsR0ptMkNZazBJNFhOUkpfOGl1aHNuZyJ9fQ.Xo8cCGurHEef8I2GlOMWJFIwRFHNImF02rCzIzctQtuJ6_u5itmpmO2KBZkB3ytA-C6j22_ZW55fykzYKHkZy7Jyv0Z8XCNa.zVcx0-y228ohjyBwFJxDdg.UFgk34BQCxsKwXAAK0_CAKgOnXyaYWXYp3lFR9VOuLiJcxK6y70nrKdUEYeNN1E-VWQfyIjFezmvGHDhXoHbB23IF-2KdMVylG9uV8ytX03_KaoEMTl9IwJnaZJuNNRl0uWGBcdVKISvfxW60x9quDjDqBPxzRN21lju48U55Fn_eRdUpA-9nW1_Smyxghj_1g6BkaDwXeDN27sKf_ni0EvGY_fzMBOTu-3pHImk4WrJflqb_WDFsqdav6Zbj3WxQMWtTeuMlcnCY1XQSvlSMvu6U3Y4Fn1BLlERjbKKf6eXHUu3yV3ycKqncKVrtggOMa0oZlasod4uIyj8pjExtjtqNSwF64JkNtG0vE0uh5Vic5pnkVZ0Q7SazkWSEHNVhjd3fvyiKR9WJKqehN_aOyjHeI6hc-2wUhJF4irJIUfeV6bQhu0j5NtFYB8jFJmqTnJtQbG9-Je_o1KUkMf1asEJ0MEfImurdg2ug9ITpIVQaFPiunmJ-PCA5VQoWsHcu2BbvAJut3OBiVOc6vFb74IW4N-U_MoqI-ePuuFkzFBsB3jz2UtCoEJ3bdEX_fMNy2KVFHil2td8TiEVGAl3xMj5hcf0QJyVQhB8AEpjsltDuVMBVc89D-tgoI8e-6qhIsfBoVmgjMbuo2Z2P6_BsuGy9T0WVrir71LTjsdu71mCxAsY-vzzxStn-1GMisOsbWiPLnKdK1CQYX-EmKk2HaHSgCGBBQ1P7NYcUFqOG4b7zh_JHba71GNa4PDeg8xExmFCvfhUKFOkqEWSUR2ogqJdqRmzcIdc4QGHToFWNAbLSIx2HoAJU-rgGwAHkYYDWfd7YOVOXaxmLcGezDwFk7TjC_dvb0nDqCvrDJKt-qASYix8LB7xKcipKVNOPbZuMSQThkvdLEFieuahy7k4KY7wEiOMmfu1aDD_EnAa7toSi_3Th9MWk4wPehGV0Nw1CybqcWNTM9SnxBICl2DLPtO4UnpxgIw5m2P_EigbXuvv-VOtX7iWicqGuYKNP0MXehnqeKV6nkqZMCSqcWwOAAhZbE3bH8N2ZH0oWJptL9frAJDnHEFmTJjGzC7N_NtvLhuaZE4nEDrOUOXZc5DXgK-oB3K63QB8wfE52D7neVdJUPCyhSftBkSNIANdlidMvVLWARaP8_W3_CWW_zdmBmN24An3Syw1iTbr0nFGHZXPnMHJbCzcSgh1whf5BgP8--wMYXKzpsFzCvHQlrJECDvBOzSW75yDo3ZTh2_Y_4I-AHnsUCQt63TYVQMK3E3mw4QsIFsjfLfuVNkzsFNlao8jaakYRaw15KATvGpWthvqbhxiWLgAj9ioadpfObFo3Ob9AXjcXnzXB37JDKTuhLeYVjOs7wqBW-tHCS5csGYq3PhpnL9X8TIgoC2o7rZ8WcHf1nXZjN9TjrVjGaKN72SLbTL9pOiJydvlxsnAjRz2yP602gTSAqi4O_PhwMrU.v-rR9Q96bfq7tlybtPCQ5jI0rNcvFzdAove5PX-wrO4';

    res.status(200).send(cookie);
 
  } catch (error) {
    console.log("Error".red, error);
    res.status(500).send({
      error: error,
    });
  }
});
//Manu New Cookie API End

//Manu Decrypt Cookie API , returns back Payload
app.post("/decryptCookie", async function (req, res, next) {
  try { 
	  console.log('Requested received in Node');
	  const encrypted = req.body.jweEncrypted;
	  console.log('Cookie Received from Req-->'+encrypted);

var payload = new Dictionary<string, object>()
{
    { "sub", "mr.x@contoso.com" },
    { "exp", 1300819380 }
};
	 
    var publicKey = new Jwk(
		crv : "P-256",
		x : "98PMbEMr5XxFqmycz3SgRAYdnfgapPh8aBZeQFhT930",
		y : "qHTt0ugI5tE0yx0gThIXfV-si4fa6lU9jj8us1xz7wY"
	);

string token = Jose.JWT.Encode(payload, publicKey, JweAlgorithm.ECDH_ES_A256KW, JweEncryption.A256CBC_HS512);
 

	res.status(200).send(token);
   
  } 
  catch (error) {
    console.log("---MyInfo NodeJs Library Error---");
    console.log(error);
    res.status(500).send({
      error: error,
    });
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
