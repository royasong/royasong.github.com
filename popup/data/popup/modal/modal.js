var modal = {
  "confirm": function (text, ok, notok) {
    ok = ok ? ok : function () {};
    notok = notok ? notok : function () {};
    /*  */
    const content = document.querySelector("#content");
    const confirm = document.querySelector("#modal-confirm");
    const okbutton = document.querySelector("#modal-confirm .ok");
    const nobutton = document.querySelector("#modal-confirm .notok");
    const message = document.querySelector("#modal-confirm .modal-message");
    /*  */
    message.textContent = text;
    confirm.style.display = "block";
    content.style.filter = "blur(2px)";
    /*  */
    okbutton.onclick = function () {
      content.style.filter = '';
      confirm.style.display = "none";
      ok();
    };
    /*  */
    nobutton.onclick = function () {
      content.style.filter = '';
      confirm.style.display = "none";
      notok();
    };
  },
  "prompt": function (text, ok, notok) {
    ok = ok ? ok : function () {};
    notok = notok ? notok : function () {};
    /*  */
    const content = document.querySelector("#content");
    const prompt = document.querySelector("#modal-prompt");
    const input = document.querySelector("#modal-prompt .input");
    const okbutton = document.querySelector("#modal-prompt .ok");
    const nobutton = document.querySelector("#modal-prompt .notok");
    const message = document.querySelector("#modal-prompt .modal-message");
    /*  */
    input.focus();
    input.value = '';
    message.textContent = text;
    prompt.style.display = "block";
    content.style.filter = "blur(2px)";
    /*  */
    okbutton.onclick = function () {
      prompt.style.display = "none";
      content.style.filter = '';
      ok(input.value);
    };
    /*  */
    nobutton.onclick = function () {
      prompt.style.display = "none";
      content.style.filter = '';
      notok();
    };
  }
};
