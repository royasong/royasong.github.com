importScripts('https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.4.0/firebase-messaging.js');
 
// Initialize Firebase
var config = {
		apiKey: "AIzaSyBe5O9Rin9xcg0xOQafmuvkCdMtzn2gawI",
		authDomain: "roya-fc113.firebaseapp.com",
		projectId: "roya-fc113",
		storageBucket: "roya-fc113.appspot.com",
		messagingSenderId: "122781594935",
		appId: "1:122781594935:web:f8c9bd3f2ce74a636896b2",
		measurementId: "G-YZW72VKQDX"
};
firebase.initializeApp(config);
console.log("service worker working");
 
const messaging = firebase.messaging();
messaging.onMessage((payload) => {
  console.log('ROYA..Message received. ', payload);
  // ...
});
