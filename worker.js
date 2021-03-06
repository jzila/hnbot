var Firebase = require("firebase");
var Transformer = require("./transformer.js");

var hnRef = new Firebase("https://hacker-news.firebaseio.com/v0/");
var transformerRef = new Firebase("https://brilliant-torch-9244.firebaseio.com/hnbot/");
var firebaseSecret = process.env.FIREBASE_SECRET;
transformerRef.authWithCustomToken(firebaseSecret, function(err) {
    if (err === null) {
        console.log("Authenticated. Starting transformer.");
        new Transformer(hnRef, transformerRef);
    } else {
        console.log("Failed to authenticate with Firebase.");
    }
});

