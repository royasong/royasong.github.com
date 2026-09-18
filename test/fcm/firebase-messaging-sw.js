
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');
 
// Initialize Firebase
var config = {
		apiKey: "AIzaSyBe5O9Rin",
		authDomain: "roya-fc13.f..",
		projectId: "roya-",
		storageBucket: "ro..m",
		messagingSenderId: "..5",
		appId: "1:122781594935.l",
		measurementId: "G-YZW7ffX"

};
firebase.initializeApp(config);
console.log("service worker working");
 
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload){
 
    console.log("Before 1");
    const title = "Hello World";
    const options = {
            body: payload.data.status
    };
    console.log("Before 2");
 
    return self.registration.showNotification(title,options);
});
