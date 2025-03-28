var config = {
	"list": [],
	"selected": false,
	"storage": {
    "eq": {}, 
    "ch": {}
  },
	"setnewpreset": function (preset) {
		delete preset["default"];
		config.list.push(preset);
	},
	"resetall": function (e) {
		config.selected = null;
		config.list = JSON.parse(JSON.stringify(e.presets));
	},
	"isselected": function (preset) {
		let tmp = config.getselected();
		return preset.name === tmp.name && preset.default === tmp.default;
	},
	"getselected": function () {
		if (!config.selected) config.selected = config.getbyname("default");
		return config.selected;
	},
	"setselected": function (name) {
		config.selected = config.getbyname(name);
		return config.getselected();
	},
	"setpreset": function (preset) {
		for (let i = 0, l = config.list.length; i < l; i++) {
			if (config.list[i].name === preset.name) config.list[i] = preset;
		}
	},
	"sort": function (e) {
		return e.sort(function (a, b) {
			if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
			if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
			return 0;
		});
	},
	"reset": function (e, n) {
		let old = config.getbyname(n, JSON.parse(JSON.stringify(e.presets)));
		for (let i = 0; i < config.list.length; i++) {
			if (config.list[i].name === n) config.list[i] = old;
		}
		/*  */
		return old;
	},
	"getusers": function () {
		let userlist = [];
		for (let i = 0; i < config.list.length; i++) {
			if (config.list[i].default !== true) userlist.push(config.list[i]);
		}
		/*  */
		return config.sort(userlist);
	},
	"getpredefined": function () {
		let retList = [];
		for (let i = 0; i < config.list.length; i++) {
			if (config.list[i].default === true) {
				retList.push(config.list[i]);
			}
		}
		/*  */
		return retList;
	},
	"getbyname": function (name, presets) {
		name = name ? name + '' : '';
		presets = presets ? presets : config.list;
		for (let i = 0; i < presets.length; i++) {
			let flag = presets[i].name.toLowerCase() === name.toLowerCase();
			if (flag) return presets[i];
		}
		/*  */
		return null;
	},
	"removebyname": function (name) {
		name = name ? name + '' : '';
		/*  */
		for (let i = 0; i < config.list.length; i++) {
			let flag_1 = config.list[i].default !== true;
			let flag_2 = config.list[i].name.toLowerCase() === name.toLowerCase();
			if (flag_1 && flag_2) {
				config.list.splice(i, 1);
				config.selected = null;
				config.getselected();
				return true;
			}
		}
		/*  */
		return false;
	}
};
