

var xhr = new XMLHttpRequest();
console.log("Script loaded")
xhr.open('POST',"http://192.168.0.103:3000/visit",true);

xhr.send();

console.log('visited');