jQuery(document).ready(function ($) {
  "use strict";

  var c,
    currentScrollTop = 0,
    navbar = $(".x-bar");

  $(window).scroll(function () {
    var a = $(window).scrollTop();
    var b = navbar.height();

    currentScrollTop = a;

    if (c < currentScrollTop && a > b + b) {
      navbar.addClass("scrollUp");
    } else if (c > currentScrollTop && !(a <= b)) {
      navbar.removeClass("scrollUp");
    }
    c = currentScrollTop;
  });
});

// Example starter JavaScript for disabling form submissions if there are invalid fields
(function () {
  "use strict";

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  var forms = document.querySelectorAll(".needs-validation");

  // Loop over them and prevent submission
  Array.prototype.slice.call(forms).forEach(function (form) {
    form.addEventListener(
      "submit",
      function (event) {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false
    );
  });
})();

var canvas = document.getElementById("signature-canvas");

function resizeCanvas() {
  var ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext("2d").scale(ratio, ratio);
}
window.onresize = resizeCanvas;
resizeCanvas();

var signaturePad = new SignaturePad(canvas, {
  backgroundColor: "rgba(0, 0, 0, 0)",
});

document.getElementById("clear").addEventListener("click", function () {
  signaturePad.clear();
});
document.getElementById("save").addEventListener("click", function () {
  if (signaturePad.isEmpty()) {
    console.log("fsjafhslaflsad");
    var dataURL = undefined;
    document.getElementById("signature").value = dataURL;
    return;
  }
  var dataURL = signaturePad.toDataURL();
  document.getElementById("signature").value = dataURL;
});
