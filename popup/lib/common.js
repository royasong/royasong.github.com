var core = {
  "start": function () {
    core.load();
  },
  "install": function () {
    core.load();
  },
  "initialize": function (callback) {
    app.storage.get(null, function (e) {
      let items = {};
      /*  */
      items.state = e.state ? e.state : "ON";
      items.ft = e.ft ? e.ft : config.setting.FT;
      items.eq = e.eq ? e.eq : config.setting.EQ;
      items.ch = e.ch ? e.ch : config.setting.CH;
      items.presets = e.presets ? e.presets : config.setting.PRESETS;
      items.whitelist = e.whitelist ? e.whitelist : config.setting.WHITELIST;
      /*  */
      callback(items);
    });
  },
  "update": {
    "addon": function () {
      app.storage.get(null, function (data) {
        app.tab.query.active(function (tab) {
          if (tab && tab.url && tab.url.indexOf("http") === 0) {
            config.icon.update(data.eq, 1);
            let domains = config.whitelist.domains;
            let hostname = (new URL(tab.url)).hostname;
            /*  */
            app.contextmenu.update("equalizer-status-enable", {"enabled": domains.indexOf(hostname) === -1});
            app.contextmenu.update("equalizer-status-disable", {"enabled": domains.indexOf(hostname) !== -1});
          }
        });
      });
    }
  },
  "load": function () {
    app.contextmenu.create({
      "contexts": ["page"],
      "id": app.contextmenu.id,
      "title": "Audio Equalizer",
      "documentUrlPatterns": ["*://*/*"]
    }, app.error);
    /*  */
    app.contextmenu.create({
      "enabled": false,
      "contexts": ["page"],
      "title": "Add to whitelist",
      "parentId": app.contextmenu.id,
      "id": "equalizer-status-enable",
      "documentUrlPatterns": ["*://*/*"]
    }, app.error);
    /*  */
    app.contextmenu.create({
      "enabled": true,
      "contexts": ["page"],
      "parentId": app.contextmenu.id,
      "id": "equalizer-status-disable",
      "title": "Remove from whitelist",
      "documentUrlPatterns": ["*://*/*"]
    }, app.error);
    /*  */
    core.initialize(function (items) {
      app.storage.set(items, function () {
        config.icon.update(items.eq, 2);
      });
    });
  },
  "action": {
    "storage": function (changes, namespace) {
      /*  */
    },
    "contextmenus": function (e) {
      if (e.menuItemId === "equalizer-status-enable") {
        app.tab.query.active(function (tab) {
          let domains = config.whitelist.domains;
          let hostname = (new URL(tab.url)).hostname;
          domains.push(hostname);
          domains = domains.filter(function (item, index, input) {return input.indexOf(item) === index});
          config.whitelist.domains = domains;
          /*  */
          app.contextmenu.update("equalizer-status-enable", {"enabled": false});
          app.contextmenu.update("equalizer-status-disable", {"enabled": true});
          app.tab.reload(tab.id);
        });
      }
      /*  */
      if (e.menuItemId === "equalizer-status-disable") {
        app.tab.query.active(function (tab) {
          let domains = config.whitelist.domains;
          let hostname = (new URL(tab.url)).hostname;
          let index = domains.indexOf(hostname);
          if (index !== -1) domains.splice(index, 1);
          config.whitelist.domains = domains;
          /*  */
          app.contextmenu.update("equalizer-status-enable", {"enabled": true});
          app.contextmenu.update("equalizer-status-disable", {"enabled": false});
          app.tab.reload(tab.id);
        });
      }
    }
  }
};

app.tab.on.updated(core.update.addon);
app.tab.on.activated(core.update.addon);
app.contextmenu.on.clicked(core.action.contextmenus);

app.on.startup(core.start);
app.on.installed(core.install);
app.on.storage(core.action.storage);
