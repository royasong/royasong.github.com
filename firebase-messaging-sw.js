importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-messaging.js');
 
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
