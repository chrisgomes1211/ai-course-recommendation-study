/* macOS-style magnifying dock (vanilla JS — no dependencies).
   Scales each icon based on cursor distance; springy CSS transition
   in neon.css does the framer-motion-like overshoot. */
(function () {
  var dock = document.getElementById("dock");
  if (!dock) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var items = Array.prototype.slice.call(dock.querySelectorAll(".dock-item"));
  var MAX_SCALE = 1.65;
  var RADIUS = 110;

  function update(clientX) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var r = item.getBoundingClientRect();
      var dist = Math.abs(clientX - (r.left + r.width / 2));
      var t = Math.max(0, 1 - dist / RADIUS);
      var s = 1 + (MAX_SCALE - 1) * t * t; /* quadratic falloff = macOS feel */
      var ico = item.querySelector(".dock-ico");
      if (ico) ico.style.transform = "scale(" + s.toFixed(3) + ")";
    }
  }

  function reset() {
    for (var i = 0; i < items.length; i++) {
      var ico = items[i].querySelector(".dock-ico");
      if (ico) ico.style.transform = "";
    }
  }

  dock.addEventListener("mousemove", function (e) { update(e.clientX); }, { passive: true });
  dock.addEventListener("mouseleave", reset);
})();
