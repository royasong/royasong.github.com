importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-messaging.js');
 
// Initialize Firebase
var config = {
    apiKey: "AIzaSyDY6AvHo9p8dozoabqkMMrSby6jIv4xM5Q",
    authDomain: "webpushtest-3562b.firebaseapp.com",
    projectId: "webpushtest-3562b",
    storageBucket: "webpushtest-3562b.appspot.com",
    messagingSenderId: "1060844639560",
    appId: "1:1060844639560:web:8b7755eda8f6c4f8210f7d",
    measurementId: "G-2C8X6K6HNT"
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
