window.addEventListener("message", function (e) {
  if (e.data.app === "audio-equalizer") {
    if (e.data.action === "app-icon-error") {
      chrome.runtime.sendMessage({"action": "app-icon-error"}, function () {
        return chrome.runtime.lastError;
      });
    }
    /*  */
    if (e.data.action === "app-icon-normal") {
      chrome.runtime.sendMessage({"action": "app-icon-normal"}, function () {
        return chrome.runtime.lastError;
      });
    }
  }
}, false);

chrome.runtime.onMessage.addListener(function (request) {
  if (request.action === "app-toggle") {
    window.postMessage({
      "action": "app-toggle",
      "state": request.state,
      "app": "audio-equalizer"
    }, '*');
  }
  /*  */
  if (request.action === "app-set") {
    window.postMessage({
      "action": "app-set",
      "app": "audio-equalizer",
      "value": {
        "eq": request.eq,
        "ch": request.ch
      }
    }, '*');
  }
});

chrome.runtime.sendMessage({"action": "page-load"}, function (url) {
  let error = chrome.runtime.lastError;
  /*  */
  if (url) {
    chrome.storage.local.get(null, function (data) {
      let hostname = (new URL(url)).hostname;
      let valid = data.whitelist.indexOf(hostname) === -1;
      if (valid) {
        let script = document.getElementById("audio-equalizer-script");
        if (!script) {
          script = document.createElement("script");
          /*  */
          script.type = "text/javascript";
          script.dataset.data = JSON.stringify(data);
          script.onload = function () {script.remove()};
          script.setAttribute("id", "audio-equalizer-script");
          script.src = chrome.runtime.getURL("data/content_script/page_context/inject.js");
          /*  */
          document.documentElement.appendChild(script);
        }
      }
    });
  }
});