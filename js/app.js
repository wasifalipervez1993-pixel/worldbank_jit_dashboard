var labelType, nativeTextSupport, animate;
var globalTreeData = null;
var globalTM = null;
var resizeTimer = null;

(function () {
  var ua = navigator.userAgent;
  var iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i);
  var typeOfCanvas = typeof HTMLCanvasElement;
  var nativeCanvasSupport = (typeOfCanvas === "object" || typeOfCanvas === "function");
  var textSupport = nativeCanvasSupport &&
    typeof document.createElement("canvas").getContext("2d").fillText === "function";

  labelType = (!nativeCanvasSupport || (textSupport && !iStuff)) ? "Native" : "HTML";
  nativeTextSupport = labelType === "Native";
  animate = !(iStuff || !nativeCanvasSupport);
})();


function formatNumber(value) {
  if (!value && value !== 0) {
    return "N/A";
  }

  return Number(value).toLocaleString();
}


function loadJSON(path, callback) {
  var request = new XMLHttpRequest();
  request.overrideMimeType("application/json");
  request.open("GET", path, true);

  request.onreadystatechange = function () {
    if (request.readyState === 4) {
      if (request.status === 200 || request.status === 0) {
        callback(JSON.parse(request.responseText));
      } else {
        document.getElementById("details").innerHTML =
          "<h3>Error</h3><p>Could not load data.json. Run the project using a local server.</p>";
      }
    }
  };

  request.send(null);
}


function updateDashboardCards(json) {
  var populationCovered = json.data.population || json.data.$area;
  var totalRegions = json.children.length;
  var latestYear = json.data.year || "N/A";

  var totalCountriesEconomies = 0;

  json.children.forEach(function (region) {
    totalCountriesEconomies += region.children.length;
  });

  document.getElementById("totalPopulation").innerHTML = formatNumber(populationCovered);
  document.getElementById("totalRegions").innerHTML = totalRegions;
  document.getElementById("totalCountries").innerHTML = totalCountriesEconomies;
  document.getElementById("latestYear").innerHTML = latestYear;
}


function updateLegend(json) {
  var legendContainer = document.getElementById("regionLegend");

  if (!legendContainer) {
    return;
  }

  var regionColors = json.data.region_colors || {};
  var legendHTML = "";

  Object.keys(regionColors).forEach(function (region) {
    legendHTML +=
      "<div class='legend-item'>" +
      "<span class='legend-color' style='background:" + regionColors[region] + "'></span>" +
      "<span class='legend-label'>" + region + "</span>" +
      "</div>";
  });

  legendContainer.innerHTML = legendHTML;
}


function getResponsiveFontSize() {
  var width = window.innerWidth;

  if (width < 600) {
    return 9;
  }

  if (width < 1000) {
    return 10;
  }

  return 11;
}


function getResponsiveTitleHeight() {
  var width = window.innerWidth;

  if (width < 600) {
    return 16;
  }

  if (width < 1000) {
    return 17;
  }

  return 18;
}


function renderTreeMap(json) {
  var infovis = document.getElementById("infovis");

  var width = infovis.clientWidth;
  var height = infovis.clientHeight;

  if (width === 0 || height === 0) {
    document.getElementById("details").innerHTML =
      "<h3>Error</h3><p>The visualization container has zero width or height. Check CSS.</p>";
    return;
  }

  infovis.innerHTML = "";

  globalTM = new $jit.TM.Squarified({
    injectInto: "infovis",

    width: width,
    height: height,

    titleHeight: getResponsiveTitleHeight(),
    offset: 1,
    animate: animate,
    duration: 800,

    Node: {
      overridable: true,
      color: "#334155"
    },

    Label: {
      type: "HTML",
      size: getResponsiveFontSize(),
      color: "#ffffff"
    },

    Events: {
      enable: true,

      onClick: function (node) {
        if (node) {
          globalTM.enter(node);
          showDetails(node);
        }
      },

      onRightClick: function () {
        globalTM.out();
      },

      onMouseEnter: function () {
        globalTM.canvas.getElement().style.cursor = "pointer";
      },

      onMouseLeave: function () {
        globalTM.canvas.getElement().style.cursor = "";
      }
    },

    Tips: {
      enable: true,
      offsetX: 15,
      offsetY: 15,

      onShow: function (tip, node) {
        var data = node.data || {};

        tip.innerHTML =
          "<div class='tip-title'>" + node.name + "</div>" +
          "<div class='tip-text'>" +
          "<strong>Population:</strong> " + formatNumber(data.population || data.$area) + "<br>" +
          "<strong>Region:</strong> " + (data.region || "Region level") + "<br>" +
          "<strong>Income group:</strong> " + (data.income_group || "Not available") +
          "</div>";
      }
    },

    onBeforePlotNode: function (node) {
      if (node.data && node.data.$color) {
        node.setData("color", node.data.$color);
      }
    },

    onCreateLabel: function (domElement, node) {
      domElement.innerHTML = node.name;
      domElement.className = "node-label";

      domElement.onclick = function () {
        globalTM.enter(node);
        showDetails(node);
      };
    },

    onPlaceLabel: function (domElement, node) {
      var labelWidth = parseFloat(domElement.style.width) || 0;
      var labelHeight = parseFloat(domElement.style.height) || 0;
      var fontSize = getResponsiveFontSize();

      // Small labels are intentionally hidden to keep the TreeMap readable.
      // Users can inspect small countries/economies through hover tooltips or by zooming in.
      if (labelWidth < 52 || labelHeight < 18) {
        domElement.style.display = "none";
      } else {
        domElement.style.display = "";
        domElement.style.overflow = "hidden";
        domElement.style.whiteSpace = "nowrap";
        domElement.style.textOverflow = "ellipsis";
        domElement.style.color = "#ffffff";
        domElement.style.fontSize = fontSize + "px";
        domElement.style.fontWeight = "bold";
        domElement.style.padding = "2px 4px";
        domElement.style.textShadow = "0 1px 2px #000000";
      }
    }
  });

  globalTM.loadJSON(json);
  globalTM.refresh();
}


function init() {
  if (typeof $jit === "undefined") {
    document.getElementById("details").innerHTML =
      "<h3>Error</h3><p>JIT library not loaded. Check js/jit.js path.</p>";
    return;
  }

  loadJSON("data.json", function (json) {
    globalTreeData = json;

    updateDashboardCards(json);
    updateLegend(json);
    renderTreeMap(json);

    document.getElementById("back").onclick = function () {
      if (globalTM) {
        globalTM.out();
      }
    };
  });
}


window.addEventListener("resize", function () {
  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(function () {
    if (globalTreeData) {
      renderTreeMap(globalTreeData);
    }
  }, 300);
});


function showDetails(node) {
  var data = node.data || {};

  document.getElementById("details").innerHTML =
    "<h3>" + node.name + "</h3>" +
    "<p><strong>Population:</strong> " + formatNumber(data.population || data.$area) + "</p>" +
    "<p><strong>Region:</strong> " + (data.region || "Region level") + "</p>" +
    "<p><strong>Income group:</strong> " + (data.income_group || "Not available") + "</p>" +
    "<p>" + (data.description || "No description available.") + "</p>";
}
