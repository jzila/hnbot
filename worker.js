var Firebase = require("firebase");
var Transformer = require("./transformer.js");

var hnRef = new Firebase("https://hacker-news.firebaseio.com/v0/");
var transformerRef = new Firebase("https://brilliant-torch-9244.firebaseio.com/hnbot/");

new Transformer(hnRef, transformerRef);
