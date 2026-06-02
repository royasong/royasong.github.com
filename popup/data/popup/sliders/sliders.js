var sliders =  {
  "width": 30,
  "height": 150,
  "canvas": null,
  "context": null,
  "pixel": {
    "ratio": window.devicePixelRatio > 1 ? 2 : 1
  },
  "prepare": function () {
    let head = document.head;
    let step = sliders.height / 10;
    let shorter = [1, 2, 3, 4, 6, 7, 8, 9];
    let longer = [0, (sliders.height / 2), (sliders.height - 1)];
    /*  */
    sliders.canvas = document.createElement("canvas");
    sliders.canvas.width = sliders.pixel.ratio * sliders.width;
    sliders.canvas.height = sliders.pixel.ratio * sliders.height;
    sliders.context = sliders.canvas.getContext("2d");
    sliders.context.beginPath();
    sliders.context.strokeStyle = "rgba(0,0,0,0.2)";
    sliders.context.lineWidth = sliders.pixel.ratio * 1;
    /*  */
    for (let i = 0; i < longer.length; i++) {
      let to = sliders.pixel.ratio * longer[i] + sliders.context.lineWidth / 2;
      sliders.context.moveTo(sliders.pixel.ratio * 2, to);
      sliders.context.lineTo(sliders.pixel.ratio * 10, to);
      sliders.context.moveTo(sliders.pixel.ratio * 20, to);
      sliders.context.lineTo(sliders.pixel.ratio * 28, to);
    }
    /*  */
    for (let i = 0; i < shorter.length; i++) {
      let to = sliders.pixel.ratio * (shorter[i] * step) + sliders.context.lineWidth / 2;
      sliders.context.moveTo(sliders.pixel.ratio * 7, to);
      sliders.context.lineTo(sliders.pixel.ratio * 10, to);
      sliders.context.moveTo(sliders.pixel.ratio * 20, to);
      sliders.context.lineTo(sliders.pixel.ratio * 23, to);
    }
    /*  */
    sliders.context.stroke();
    sliders.context.closePath();
    /*  */
    const style = document.createElement("style");
    style.setAttribute("type", "text/css");
    head.appendChild(style);
    style.textContent = `
      .controls-sliders .slider {
        background-image: url(${sliders.canvas.toDataURL("image/png")});
        background-size: ${sliders.width + 2}px ${sliders.height}px;
        background-position: center 0;
        background-repeat: no-repeat;
      }
    `;
  }
};
