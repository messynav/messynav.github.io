/* MessyNav affordance reasoning demo.
   Sends an image to the Cloudflare Worker, which holds the Gemini key and runs
   the same two prompts as the paper, then draws the returned labels. */

// Set this to your deployed Worker URL after `npx wrangler deploy`.
var MESSYNAV_DEMO_ENDPOINT = "https://messynav-affordance.kenllo.workers.dev";

(function () {
  var MAX_SIDE = 1024;
  var INTERACTIVE = "#1B9E4B";
  var NON_INTERACTIVE = "#D32F2F";

  var fileInput = document.getElementById("demo-file");
  var canvas = document.getElementById("demo-canvas");
  var status = document.getElementById("demo-status");
  var tableWrap = document.getElementById("demo-table");
  if (!fileInput || !canvas) return;

  var ctx = canvas.getContext("2d");
  var busy = false;

  function setStatus(msg, kind) {
    status.textContent = msg || "";
    status.className = "demo-status" + (kind ? " is-" + kind : "");
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error("Could not load that image.")); };
      img.src = src;
    });
  }

  /* Downscale before upload: keeps the request small and matches the
     resolution the model sees in our own evaluation. */
  function toScaled(img) {
    var scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    var w = Math.round(img.width * scale);
    var h = Math.round(img.height * scale);
    var off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    off.getContext("2d").drawImage(img, 0, 0, w, h);
    return off;
  }

  function drawResults(source, boxes, properties) {
    canvas.width = source.width;
    canvas.height = source.height;
    ctx.drawImage(source, 0, 0);

    var fontSize = Math.max(12, Math.round(canvas.width / 52));
    ctx.font = "600 " + fontSize + "px 'Noto Sans', sans-serif";
    ctx.textBaseline = "top";
    ctx.lineWidth = Math.max(2, Math.round(canvas.width / 340));

    boxes.forEach(function (box) {
      var c = box.box_2d;
      if (!c || c.length !== 4) return;
      var label = String(box.label || "").trim();
      var prop = properties[label] || properties[label.replace(/ /g, "_")] || {};
      var interactive = String(prop.mobility || "").indexOf("interactive") === 0;
      var colour = interactive ? INTERACTIVE : NON_INTERACTIVE;

      // Gemini returns [ymin, xmin, ymax, xmax] normalized to 0-1000.
      var x0 = (c[1] / 1000) * canvas.width;
      var y0 = (c[0] / 1000) * canvas.height;
      var x1 = (c[3] / 1000) * canvas.width;
      var y1 = (c[2] / 1000) * canvas.height;

      ctx.strokeStyle = colour;
      ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);

      var tag = label + " [" + (interactive ? "I" : "N") + "]";
      var tw = ctx.measureText(tag).width;
      var ty = Math.max(0, y0 - fontSize - 6);
      ctx.fillStyle = colour;
      ctx.fillRect(x0, ty, tw + 10, fontSize + 6);
      ctx.fillStyle = "#fff";
      ctx.fillText(tag, x0 + 5, ty + 3);
    });
    canvas.hidden = false;
  }

  function drawTable(properties) {
    var names = Object.keys(properties);
    if (!names.length) { tableWrap.innerHTML = ""; return; }
    var rows = names.map(function (name) {
      var p = properties[name] || {};
      var interactive = String(p.mobility || "").indexOf("interactive") === 0;
      return "<tr><td>" + name.replace(/_/g, " ") + "</td>" +
        '<td style="color:' + (interactive ? INTERACTIVE : NON_INTERACTIVE) + '">' +
        (interactive ? "interactive" : "non-interactive") + "</td>" +
        "<td>" + (p.interaction || "") + "</td></tr>";
    }).join("");
    tableWrap.innerHTML =
      '<table class="table is-fullwidth is-hoverable results-table">' +
      "<thead><tr><th>object</th><th>mobility</th><th>interaction</th></tr></thead>" +
      "<tbody>" + rows + "</tbody></table>";
  }

  function run(src) {
    if (busy) return;
    busy = true;
    tableWrap.innerHTML = "";
    setStatus("Reasoning about affordances…", "busy");

    loadImage(src)
      .then(function (img) {
        var scaled = toScaled(img);
        canvas.width = scaled.width;
        canvas.height = scaled.height;
        ctx.drawImage(scaled, 0, 0);
        canvas.hidden = false;

        var dataUrl = scaled.toDataURL("image/jpeg", 0.85);
        return fetch(MESSYNAV_DEMO_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: dataUrl.split(",")[1],
            mimeType: "image/jpeg",
          }),
        }).then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
            return { data: data, scaled: scaled };
          });
        });
      })
      .then(function (out) {
        var props = out.data.object_properties || {};
        var boxes = out.data.boxes || [];
        if (!Object.keys(props).length) {
          setStatus("No objects were identified in this image.", "error");
        } else {
          drawResults(out.scaled, boxes, props);
          drawTable(props);
          setStatus(
            boxes.length
              ? "Green = interactive, red = non-interactive."
              : "Labels predicted, but the objects could not be localized.",
            "done"
          );
        }
      })
      .catch(function (err) {
        setStatus(err.message || "Something went wrong.", "error");
      })
      .then(function () { busy = false; });
  }

  fileInput.addEventListener("change", function () {
    var file = fileInput.files && fileInput.files[0];
    if (file) run(URL.createObjectURL(file));
  });

  Array.prototype.forEach.call(
    document.querySelectorAll("[data-demo-example]"),
    function (btn) {
      btn.addEventListener("click", function () {
        run(btn.getAttribute("data-demo-example"));
      });
    }
  );
})();
