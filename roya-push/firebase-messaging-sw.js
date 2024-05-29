importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-messaging.js');
 
// Initialize Firebase
var config = {
  apiKey: "AIzaSyD7MEEXYS6JtC7Gdx9kBEzR3Eo3IMnMcw4",
  authDomain: "roya-1b381.firebaseapp.com",
  projectId: "roya-1b381",
  storageBucket: "roya-1b381.appspot.com",
  messagingSenderId: "78984445741",
  appId: "1:78984445741:web:389939fd856d4542729da4",
  measurementId: "G-1JF8Y9HX78"
};
firebase.initializeApp(config);
 
const messaging = firebase.messaging();
messaging.setBackgroundMessageHandler(function(payload){
 
    const title = "Hello Roya World";
    const options = {
            body: payload.data.status
    };
 
    return self.registration.showNotification(title,options);
});
