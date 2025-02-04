var chart = {
  "canvas": null,
	"context": null,
	"pixel": {
    "ratio": window.devicePixelRatio > 1 ? 2 : 1
  },
  "size": {
    "width": 400,
    "height": 72
  },
	"metrics": {
		'a': 40,        // x transform
    'b': 20,        // y transform
    'c': 12,        // font size
    'd': 12,        // y scale
    'e': 32,        // x scale
    'f': 10,        // font top
    'g': 3,         // font spacing
    'h': 300,       // x max
    'i': 270,       // font right
    'j': 38,        // font left
		'k': 1,         // line weight
		'l': "#ffffff", // line color
		'm': "#e17540", // theme color
		'n': 0          // offset top
	},
	"prepare": function (eq) {
		chart.canvas = document.getElementById("chart");
		chart.canvas.width = chart.pixel.ratio * chart.size.width;
    chart.canvas.height = chart.pixel.ratio * chart.size.height;
    /*  */
		chart.context = chart.canvas.getContext("2d");
    chart.context.translate(chart.pixel.ratio * chart.metrics.a, chart.pixel.ratio * chart.metrics.d);
		chart.context.beginPath();
		chart.context.moveTo(chart.pixel.ratio * chart.metrics.d, chart.pixel.ratio * chart.metrics.b);
		chart.context.lineTo(chart.pixel.ratio * chart.metrics.h, chart.pixel.ratio * chart.metrics.b);
		chart.context.lineWidth = chart.pixel.ratio * chart.metrics.k;
		chart.context.strokeStyle = chart.metrics.l;
		chart.context.stroke();
		chart.context.beginPath();
		/*  */
		for (let i = 0; i < eq.length - 1; i++) {
			chart.context.moveTo(chart.pixel.ratio * ((i * chart.metrics.e) + chart.metrics.d), chart.pixel.ratio * chart.metrics.n);
			chart.context.lineTo(chart.pixel.ratio * ((i * chart.metrics.e) + chart.metrics.d), chart.pixel.ratio * chart.metrics.a);
		}
		/*  */
		chart.context.stroke();
		chart.context.beginPath();
		chart.context.stroke();
		chart.context.fillStyle = chart.metrics.l;
		chart.context.strokeStyle = chart.metrics.l;
		chart.context.lineWidth = chart.pixel.ratio * chart.metrics.k;
		chart.context.font = (chart.pixel.ratio * chart.metrics.c) + "px monospace";
		/*  */
		chart.context.textAlign = "right";
    chart.context.fillText("+" + chart.metrics.d + " db", chart.pixel.ratio * (chart.metrics.a - chart.metrics.j), chart.pixel.ratio * (chart.metrics.f + chart.metrics.g) - chart.metrics.c);
    chart.context.fillText("-" + chart.metrics.d + " db", chart.pixel.ratio * (chart.metrics.a - chart.metrics.j), chart.pixel.ratio * (chart.metrics.a - chart.metrics.g) + chart.metrics.c);
		/*  */
		chart.context.textAlign = "left";
    chart.context.fillText("+" + chart.metrics.d + " db", chart.pixel.ratio * (chart.metrics.a + chart.metrics.i), chart.pixel.ratio * (chart.metrics.f + chart.metrics.g) - chart.metrics.c);
    chart.context.fillText("-" + chart.metrics.d + " db", chart.pixel.ratio * (chart.metrics.a + chart.metrics.i), chart.pixel.ratio * (chart.metrics.a - chart.metrics.g) + chart.metrics.c);
		/*  */
		chart.context.closePath();
		chart.refresh(eq);
	},
	"refresh": function (eq) {
		let points = [];
    /*  */
		for (let i = 1; i < eq.length; i++) {
			points.push({
				"xy": 0,
				"xc": 0,
				"x": ((i - 1) * chart.metrics.e) + chart.metrics.d,
				"y": chart.metrics.b - (chart.metrics.b / chart.metrics.d) * eq[i].gain
			});
		}
		/*  */
		chart.context.beginPath();
		chart.context.moveTo(chart.pixel.ratio * points[0].x, chart.pixel.ratio * points[0].y);
		/*  */
		for (let i = 1; i < points.length - 2; i++) {
			let xc = (points[i].x + points[i + 1].x) / 2;
			let yc = (points[i].y + points[i + 1].y) / 2;
			chart.context.quadraticCurveTo(chart.pixel.ratio * points[i].x, chart.pixel.ratio * points[i].y, chart.pixel.ratio * xc, chart.pixel.ratio * yc);
		}
		/*  */
		let i = points.length - 2;
		chart.context.quadraticCurveTo(chart.pixel.ratio * points[i].x, chart.pixel.ratio * points[i].y, chart.pixel.ratio * points[i + 1].x, chart.pixel.ratio * points[i + 1].y);
		chart.context.lineWidth = chart.pixel.ratio * chart.metrics.k;
		chart.context.strokeStyle = chart.metrics.m;
		chart.context.stroke();
		/*  */
		let gradiend = chart.context.createLinearGradient(chart.pixel.ratio * 0, chart.pixel.ratio * 0, chart.pixel.ratio * 0, chart.pixel.ratio * chart.metrics.a);
		gradiend.addColorStop(0.0, chart.metrics.m);
		gradiend.addColorStop(0.5, chart.metrics.m);
		gradiend.addColorStop(1.0, chart.metrics.m);
		/*  */
		points = [];
		for (let i = 1; i < eq.length; i++) {
			points.push({
				"xc": 0,
				"xy": 0,
				"x": ((i - 1) * chart.metrics.e) + chart.metrics.d,
				"y": chart.metrics.b - (chart.metrics.b / chart.metrics.d) * eq[i].gain
			});
		}
		/*  */
		chart.context.beginPath();
		chart.context.moveTo(chart.pixel.ratio * chart.metrics.d, chart.pixel.ratio * chart.metrics.b);
		chart.context.lineTo(chart.pixel.ratio * points[0].x, chart.pixel.ratio * points[0].y);
		/*  */
		for (let i = 1; i < points.length - 2; i++) {
			let xc = (points[i].x + points[i + 1].x) / 2;
			let yc = (points[i].y + points[i + 1].y) / 2;
			chart.context.quadraticCurveTo(chart.pixel.ratio * points[i].x, chart.pixel.ratio * points[i].y, chart.pixel.ratio * xc, chart.pixel.ratio * yc);
		}
		/*  */
		chart.context.quadraticCurveTo(chart.pixel.ratio * points[i].x, chart.pixel.ratio * points[i].y, chart.pixel.ratio * points[i + 1].x, chart.pixel.ratio * points[i + 1].y);
		chart.context.lineTo(chart.pixel.ratio * chart.metrics.h, chart.pixel.ratio * chart.metrics.b);
		chart.context.closePath();
		chart.context.fillStyle = gradiend;
		chart.context.fill();
	}
};
