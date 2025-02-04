app.version = function () {return chrome.runtime.getManifest().version};
app.homepage = function () {return chrome.runtime.getManifest().homepage_url};

if (!navigator.webdriver) {
  app.on.uninstalled(app.homepage() + "?v=" + app.version() + "&type=uninstall");
  app.on.installed(function (e) {
    app.on.management(function (result) {
      if (result.installType === "normal") {
        app.tab.query.index(function (index) {
          let previous = e.previousVersion !== undefined && e.previousVersion !== app.version();
          let doupdate = previous && parseInt((Date.now() - config.welcome.lastupdate) / (24 * 3600 * 1000)) > 45;
          if (e.reason === "install" || (e.reason === "update" && doupdate)) {
            let parameter = (e.previousVersion ? "&p=" + e.previousVersion : '') + "&type=" + e.reason;
            let url = app.homepage() + "?v=" + app.version() + parameter;
            app.tab.open(url, index, e.reason === "install");
            config.welcome.lastupdate = Date.now();
          }
        });
      }
    });
  });
}

app.on.connect(function (port) {
  if (port) {
    if (port.name) {
      if (port.name in app) {
        app[port.name].port = port;
      }
    }
    /*  */
    port.onDisconnect.addListener(function (e) {
      app.storage.load(function () {
        if (e) {
          if (e.name) {
            if (e.name in app) {
              app[e.name].port = null;
            }
          }
        }
      });
    });
    /*  */
    port.onMessage.addListener(function (e) {
      app.storage.load(function () {
        if (e) {
          if (e.path) {
            if (e.port) {
              if (e.port in app) {
                if (e.path === (e.port + "-to-background")) {
                  for (let id in app[e.port].message) {
                    if (app[e.port].message[id]) {
                      if ((typeof app[e.port].message[id]) === "function") {
                        if (id === e.method) {
                          app[e.port].message[id](e.data);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
    });
  }
});

app.on.message(function (request, sender, sendResponse) {
  let error = chrome.runtime.lastError;
  let url = sender.tab && sender.tab.url ? sender.tab.url : (sender.url ? sender.url : '');
  /*  */
  if (request) {
    if (request.action === "page-load") sendResponse(url);
    /*  */
    if (request.action === "app-icon-error") {
      let hostname = url ? (new URL(url)).hostname : '';
      if (hostname) {
        config.blacklist.domains.push(hostname);
        config.blacklist.domains = config.blacklist.domains.filter(function(item, index, input) {
          return input.indexOf(item) === index;
        });
      }
      /*  */
      core.initialize(function (items) {
        config.icon.update(items.eq, 3);
      });
    }
    /*  */
    if (request.action === "app-icon-normal") {
      let hostname = url ? (new URL(url)).hostname : '';
      if (hostname) {
        let index = config.blacklist.domains.indexOf(hostname);
        if (index > -1) config.blacklist.domains.splice(index, 1);
      }
      /*  */
      core.initialize(function (items) {
        config.icon.update(items.eq, 4);
      });
    }
    /*  */
    if (request.action === "app-toggle") {
      config.addon.state = config.addon.state === "ON" ? "OFF" : "ON";
      app.tab.query.all({}, function (tabs) {
        if (tabs) {
          for (let i = 0; i < tabs.length; i++) {
            request.state = config.addon.state;
            app.tab.send.message(tabs[i].id, request);
          }
        }
      });
      /*  */
      sendResponse(config.addon.state);
      core.initialize(function (items) {
        config.icon.update(items.eq, 5);
      });
    }
    /*  */
    if (request.action === "app-set") {
      let items = {};
      items.eq = request.eq;
      items.ch = request.ch;
      items.presets = request.presets;
      items.selected = request.selected;
      /*  */
      app.storage.set(items, function () {
        app.tab.query.all({}, function (tabs) {
          if (tabs) {
            for (let i = 0; i < tabs.length; i++) {
              app.tab.send.message(tabs[i].id, request);
            }
          }
        });
        /*  */
        sendResponse(null);
        config.icon.update(items.eq, 6);
     });
    }
  }
});
