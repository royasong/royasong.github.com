"use strict";
/// <reference lib="dom" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const userId = localStorage.getItem('userId');
const elements = {
    // Status text
    currentUserId: null,
    registration: null,
    pushSupport: null,
    notificationPermission: null,
    subscription: null,
    sendStatus: null,
    // Inputs
    message: null,
    targetUserId: null,
};
const store = {
    pushSupport: false,
    serviceWorkerRegistration: null,
    pushSubscription: null,
};
if (!userId)
    location.href = 'login.html';
function registerServiceWorker() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!('serviceWorker' in navigator))
            return;
        let registration = yield navigator.serviceWorker.getRegistration();
        if (!registration) {
            registration = yield navigator.serviceWorker.register('./service-worker.js');
        }
        store.serviceWorkerRegistration = registration !== null && registration !== void 0 ? registration : null;
        store.pushSupport = !!(registration === null || registration === void 0 ? void 0 : registration.pushManager);
        store.pushSubscription = yield ((_a = registration === null || registration === void 0 ? void 0 : registration.pushManager) === null || _a === void 0 ? void 0 : _a.getSubscription());
        updateStatus();
    });
}
function postSubscription(subscription) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('postSubscription', { subscription });
        if (!subscription) {
            showAlert('postSubscription - subscription cannot be empty');
            return;
        }
        const response = yield fetch('/subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, subscription }),
        });
        console.log('postSubscription', { response });
    });
}
function deleteSubscription() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch('/subscription', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });
        console.log('deleteSubscription', { response });
    });
}
function subscribe() {
    return __awaiter(this, void 0, void 0, function* () {
        if (store.pushSubscription) {
            showAlert('subscribe - already subscribed');
            return;
        }
        try {
            const response = yield fetch('/vapid-public-key');
            const vapidPublicKey = yield response.text();
            console.log('subscribe', { vapidPublicKey });
            const registration = store.serviceWorkerRegistration;
            if (!registration) {
                showAlert('subscribe - service worker is not registered');
                return;
            }
            const subscription = yield registration.pushManager.subscribe({
                applicationServerKey: vapidPublicKey,
                userVisibleOnly: true,
            });
            store.pushSubscription = subscription;
            yield postSubscription(subscription);
        }
        catch (error) {
            console.error('subscribe', { error });
        }
        finally {
            updateStatus();
        }
    });
}
function unsubscribe() {
    return __awaiter(this, void 0, void 0, function* () {
        const subscription = store.pushSubscription;
        if (!subscription) {
            showAlert('unsubscribe - push subscription not exist');
            return;
        }
        try {
            const unsubscribed = yield subscription.unsubscribe();
            store.pushSubscription = null;
            console.log('unsubscribe', { unsubscribed });
            yield deleteSubscription();
        }
        catch (error) {
            console.error('unsubscribe', { error });
        }
        finally {
            updateStatus();
        }
    });
}
function sendPushNotification() {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const targetId = (_a = elements.targetUserId) === null || _a === void 0 ? void 0 : _a.value;
        const message = (_c = (_b = elements.message) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : '';
        console.log('sendPushNotification', { targetId, message });
        if (!targetId) {
            showAlert('Target userId cannot be empty');
            return;
        }
        const response = yield fetch('/send-push-notification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ targetId, message }),
        });
        console.log('sendPushNotification', { response });
        setText(elements.sendStatus, `(${response.status}) ${response.statusText} / ${new Date()}`);
    });
}
function setText(element, value) {
    if (!element)
        return;
    element.textContent = value.toString();
    element.classList.remove('t');
    element.classList.remove('f');
    typeof value === 'boolean' && element.classList.add(value ? 't' : 'f');
}
function updateStatus() {
    return __awaiter(this, void 0, void 0, function* () {
        setText(elements.currentUserId, userId);
        setText(elements.registration, !!store.serviceWorkerRegistration);
        setText(elements.pushSupport, store.pushSupport);
        setText(elements.notificationPermission, Notification.permission);
        setText(elements.subscription, JSON.stringify(store.pushSubscription, null, 2));
    });
}
function showAlert(message) {
    console.warn(message);
    alert(message);
}
function logout() {
    localStorage.removeItem('userId');
    location.href = 'login.html';
}
window.onload = () => {
    elements.currentUserId = document.getElementById('current_user_id');
    elements.registration = document.getElementById('registration_status');
    elements.pushSupport = document.getElementById('push_support_status');
    elements.notificationPermission = document.getElementById('notification_permission_status');
    elements.subscription = document.getElementById('subscription');
    elements.sendStatus = document.getElementById('send_status');
    elements.message = document.getElementById('message');
    elements.targetUserId = document.getElementById('target_user_id');
    updateStatus();
};
registerServiceWorker();
