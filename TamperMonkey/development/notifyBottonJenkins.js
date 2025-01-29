// ==UserScript==
// @name         notify jenkins
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  notify when build is done
// @author       marobert
// @include      /^https:\/\/jenkins.omnimed.com(\/job|.*blue.*detail)\/.*\/\d+\/(pipeline.*|$)
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_xmlhttpRequest
// @connect      slack.com
// ==/UserScript==

// Const
const SLACK_BOT_TOKEN = 'token'; // Add the Rob notification Slack Api token
const SLACK_USER_ID = 'User_ID'; // Replace with your Slack user ID
const url = document.URL;
const storedIsActive = 'isActive'+ url;
let message = 'Le <' + url + '|build> que vous m\'avez demandé de suivre est terminé avec le statut ';
let notifyBottonOff = document.createElement('img');
let notifyBottonOn = document.createElement('img');

// Function to set a storage item with an expiration
function setLocalStorageItemWithExpiry(key, value, expiryInMs) {
    const now = new Date();
    const item = {
        value: value,
        expiry: now.getTime() + expiryInMs, // Set expiry time in milliseconds
    };
    localStorage.setItem(key, JSON.stringify(item));
}

// Function to get a storage item with an expiration
function getLocalStorageItem(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
        return null; // Item doesn't exist
    }

    const item = JSON.parse(itemStr);
    const now = new Date();

    if (now.getTime() > item.expiry) {
        localStorage.removeItem(key); // Remove expired item
        return null;
            }
    return item.value;
}


// Function to send the Slack notification
function sendSlackNotification() {
    GM_xmlhttpRequest({
        method: 'POST',
        url: 'https://slack.com/api/chat.postMessage',
        headers: {
            'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({
            channel: SLACK_USER_ID,
            text: message
        }),
        onload: function(response) {
            const responseData = JSON.parse(response.responseText);
            if (responseData.ok) {
               console.log('Notification sent successfully!');
            } else {
                console.error('Error sending notification:', responseData.error);
            }
        },
        onerror: function(error) {
            console.error('Request failed:', error);
        }
    });
}


// Function to monitor Jenkins build statut
function monitorBuild() {
    notifyBottonOff.style.visibility = 'hidden';
    notifyBottonOn.style.visibility = 'visible';

    if (document.querySelectorAll('[title*=\'Annulé\']').length > 0 | document.getElementsByClassName('BasicHeader--aborted').length > 0) {
       message = message + 'Annulé';
    } else if (document.querySelectorAll('[title*=\'Succès\']').length > 0 | document.getElementsByClassName('BasicHeader--success').length > 0) {
       message = message + 'Succès';
    } else if (document.querySelectorAll('[title*=\'En échec\']').length > 0 | document.getElementsByClassName('BasicHeader--failure').length > 0) {
       message = message + 'En échec';
    } else {
       if (!getLocalStorageItem(storedIsActive)){
           setLocalStorageItemWithExpiry(storedIsActive, true, 3*60*60*1000); //Expire after 2h
       }
       console.log('refresh incomming');
       setTimeout(function(){ location.reload(); }, 30000);
       return;
    }
   sendSlackNotification();
   stopMonitorBuild();
}

// Function to stop monitoring Jenkins build statut
function stopMonitorBuild() {
   notifyBottonOn.style.visibility = 'hidden';
   notifyBottonOff.style.visibility = 'visible';
   localStorage.removeItem(storedIsActive);
}

// Function to add botton to be notify
function addBotton() {
    notifyBottonOff.src = 'https://png.pngtree.com/png-clipart/20190705/original/pngtree-vvector-notification-icon-png-image_4232478.jpg';
    notifyBottonOff.style = `position: absolute; bottom: 15px; left: 15px; z-index: 10000; width: 50px; height: 50px; cursor: pointer;`;
    document.body.prepend(notifyBottonOff);
    notifyBottonOn.src = 'https://cdn4.iconfinder.com/data/icons/blue-common-symbols-vol-2/1024/notification_2_notifying_notify_notified_app_mobile-512.png';
    notifyBottonOn.style = `position: absolute; bottom: 15px; left: 15px; z-index: 10000; width: 50px; height: 50px; cursor: pointer;`;
    document.body.prepend(notifyBottonOn);

    if (getLocalStorageItem(storedIsActive)){
        setTimeout(function(){ monitorBuild(); }, 1000);
    } else {
        notifyBottonOn.style.visibility = 'hidden';
    }

    notifyBottonOff.addEventListener('click', () => {
        monitorBuild();
    });

    notifyBottonOn.addEventListener('click', () => {
        stopMonitorBuild();
    });
}

// Add the notify botton
addBotton();
