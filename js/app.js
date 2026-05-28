var labelType, nativeTextSupport, useGradients, animate;

var globalTreeData = null;
var globalCurrentTree = null;
var globalTM = null;

var resizeTimer = null;
var selectedMode = "squarified";
var selectedYear = null;
var availableYears = [];

(function () {
  var ua = navigator.userAgent;
  var iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i);
  var typeOfCanvas = typeof HTMLCanvasElement;
  var nativeCanvasSupport =
    typeOfCanvas === "object" || typeOfCanvas === "function";
  var textSupport =
    nativeCanvasSupport &&
    typeof document.createElement("canvas").getContext("2d").fillText ===
      "function";

  labelType =
    !nativeCanvasSupport || (textSupport && !iStuff) ? "Native" : "HTML";
  nativeTextSupport = labelType === "Native";
  useGradients = nativeCanvasSupport;
  animate = !(iStuff || !nativeCanvasSupport);
})();

function formatNumber(value) {
  if (!value && value !== 0) return "N/A";
  return Number(value).toLocaleString();
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadJSON(path, callback) {
  var request = new XMLHttpRequest();
  request.overrideMimeType("application/json");
  request.open("GET", path + "?v=" + Date.now(), true);

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

function getPopulationForYear(node, year) {
  if (!node || !node.data || !node.data.populations) return 0;

  var value = node.data.populations[String(year)];

  if (!value || value <= 0) return 0;

  return Number(value);
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");

  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map(function (x) {
        var hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

function blendColors(colorA, colorB, factor) {
  var a = hexToRgb(colorA);
  var b = hexToRgb(colorB);

  var r = Math.round(a.r + (b.r - a.r) * factor);
  var g = Math.round(a.g + (b.g - a.g) * factor);
  var bl = Math.round(a.b + (b.b - a.b) * factor);

  return rgbToHex(r, g, bl);
}

function getCountryPopulationBounds(rawJson, year) {
  var values = [];

  rawJson.children.forEach(function (region) {
    region.children.forEach(function (country) {
      var value = getPopulationForYear(country, year);
      if (value > 0) values.push(value);
    });
  });

  if (values.length === 0) {
    return { min: 1, max: 1 };
  }

  return {
    min: Math.min.apply(null, values),
    max: Math.max.apply(null, values),
  };
}

function getPopulationShade(baseColor, population, bounds) {
  if (!population || population <= 0) return baseColor;

  var minLog = Math.log10(Math.max(bounds.min, 1));
  var maxLog = Math.log10(Math.max(bounds.max, 1));
  var popLog = Math.log10(Math.max(population, 1));

  var ratio = 0.5;

  if (maxLog !== minLog) {
    ratio = (popLog - minLog) / (maxLog - minLog);
  }

  /*
    Region hue is preserved.
    Small population -> lighter region shade.
    Large population -> darker region shade.
  */
  var lightColor = blendColors(baseColor, "#FFFFFF", 0.45);
  var darkColor = blendColors(baseColor, "#111827", 0.18);

  return blendColors(lightColor, darkColor, ratio);
}

function buildTreeForYear(rawJson, year) {
  var yearString = String(year);
  var bounds = getCountryPopulationBounds(rawJson, yearString);

  var tree = {
    id: rawJson.id,
    name: "World Population by Region (" + yearString + ")",
    data: {
      $area: 0,
      population: 0,
      year: yearString,
      available_years: rawJson.data.available_years || [],
      min_year: rawJson.data.min_year,
      max_year: rawJson.data.max_year,
      region_colors: rawJson.data.region_colors || {},
      description: "World Bank population dataset for " + yearString,
    },
    children: [],
  };

  rawJson.children.forEach(function (region) {
    var regionBaseColor =
      region.data.base_color || region.data.$color || "#999999";

    var regionNode = {
      id: region.id,
      name: region.name,
      data: {
        $area: 0,
        $color: regionBaseColor,
        base_color: regionBaseColor,
        population: 0,
        region: region.name,
        income_group: "Not available",
        description: "Total population of " + region.name + " in " + yearString,
      },
      children: [],
    };

    var regionPopulation = 0;

    region.children.forEach(function (country) {
      var countryPopulation = getPopulationForYear(country, yearString);

      if (countryPopulation <= 0) return;

      var countryBaseColor =
        country.data.base_color || country.data.$color || regionBaseColor;
      var shadedColor = getPopulationShade(
        countryBaseColor,
        countryPopulation,
        bounds,
      );

      var countryNode = {
        id: country.id,
        name: country.name,
        data: {
          $area: countryPopulation,
          $color: shadedColor,
          base_color: countryBaseColor,
          population: countryPopulation,
          region: country.data.region,
          income_group: country.data.income_group || "Not available",
          description: country.name + " population in " + yearString,
        },
        children: [],
      };

      regionPopulation += countryPopulation;
      regionNode.children.push(countryNode);
    });

    if (regionPopulation > 0 && regionNode.children.length > 0) {
      regionNode.data.$area = regionPopulation;
      regionNode.data.population = regionPopulation;

      tree.data.$area += regionPopulation;
      tree.data.population += regionPopulation;
      tree.children.push(regionNode);
    }
  });

  return tree;
}

function updateDashboardCards(tree) {
  var totalCountriesEconomies = 0;

  tree.children.forEach(function (region) {
    totalCountriesEconomies += region.children.length;
  });

  document.getElementById("totalPopulation").innerHTML = formatNumber(
    tree.data.population || tree.data.$area,
  );
  document.getElementById("totalRegions").innerHTML = tree.children.length;
  document.getElementById("totalCountries").innerHTML = totalCountriesEconomies;
  document.getElementById("latestYear").innerHTML = tree.data.year || "N/A";
}

function updateLegend(json) {
  var legendContainer = document.getElementById("regionLegend");
  if (!legendContainer) return;

  var regionColors = json.data.region_colors || {};
  var legendHTML = "";

  Object.keys(regionColors).forEach(function (region) {
    legendHTML +=
      "<div class='legend-item'>" +
      "<span class='legend-color' style='background:" +
      regionColors[region] +
      "'></span>" +
      "<span class='legend-label'>" +
      region +
      "</span>" +
      "</div>";
  });

  legendContainer.innerHTML = legendHTML;
}

function updateModeDescription(mode) {
  var description = document.getElementById("modeDescription");
  if (!description) return;

  if (mode === "squarified") {
    description.innerHTML =
      "Displays the complete hierarchy using JIT Squarified TreeMap animation.";
  } else if (mode === "ondemand") {
    description.innerHTML =
      "Starts at region level and loads child nodes using JIT request and prune logic.";
  } else if (mode === "cushion") {
    description.innerHTML =
      "Uses JIT Cushion TreeMap rendering with gradient-based depth effect.";
  }
}

function updateVisualDescription() {
  var visualDescription = document.getElementById("visualDescription");

  if (!visualDescription) {
    return;
  }

  visualDescription.innerHTML =
    "Data units are grouped by World Bank region for " +
    selectedYear +
    ". Rectangle area represents population size. Color hue represents region, while shade intensity helps distinguish population magnitude.";
}

function setupYearControls(json) {
  var yearInput = document.getElementById("yearInput");
  var applyYearButton = document.getElementById("applyYear");
  var yearRangeText = document.getElementById("yearRangeText");
  var yearMessage = document.getElementById("yearMessage");

  availableYears = json.data.available_years || [];

  if (!availableYears.length) {
    yearRangeText.innerHTML =
      "<strong>Available year range could not be detected.</strong> Please regenerate data.json.";
    yearMessage.className = "year-message error";
    yearMessage.innerHTML = "Missing available_years in data.json.";
    return;
  }

  var minYear = json.data.min_year || availableYears[0];
  var maxYear = json.data.max_year || availableYears[availableYears.length - 1];

  selectedYear = String(json.data.year || maxYear);

  yearInput.min = minYear;
  yearInput.max = maxYear;
  yearInput.value = selectedYear;

  yearRangeText.innerHTML =
    "Available year range: <strong>" + minYear + " to " + maxYear + "</strong>";

  yearMessage.className = "year-message";
  yearMessage.innerHTML = "";

  applyYearButton.onclick = function () {
    applySelectedYear();
  };

  yearInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      applySelectedYear();
    }
  });
}

function applySelectedYear() {
  var yearInput = document.getElementById("yearInput");
  var yearMessage = document.getElementById("yearMessage");

  var requestedYear = String(yearInput.value).trim();

  if (!requestedYear) {
    yearMessage.className = "year-message error";
    yearMessage.innerHTML = "Please enter a year.";
    return;
  }

  if (availableYears.indexOf(requestedYear) === -1) {
    yearMessage.className = "year-message error";
    yearMessage.innerHTML =
      "Data for " +
      requestedYear +
      " is not available. Please enter a year within the shown range.";
    return;
  }

  selectedYear = requestedYear;
  resetDetailsPanel();

  yearMessage.className = "year-message success";
  yearMessage.innerHTML = "TreeMap updated for " + selectedYear + ".";

  renderDashboardForSelectedYear();
}

function getResponsiveFontSize() {
  var width = window.innerWidth;

  if (width < 700) return 10;
  if (width < 1200) return 11;
  if (width < 1700) return 12;

  return 13;
}

function getResponsiveTitleHeight(mode) {
  if (mode === "ondemand" || mode === "cushion") return 0;

  var width = window.innerWidth;

  if (width < 700) return 17;
  if (width < 1200) return 18;

  return 20;
}

function getTreeForMode(tree, mode) {
  var treeCopy = deepClone(tree);

  if (mode === "ondemand") {
    if ($jit.json && $jit.json.prune) {
      $jit.json.prune(treeCopy, 1);
    }
  }

  return treeCopy;
}

function resetDetailsPanel() {
  document.getElementById("details").innerHTML =
    "<h3>Details</h3>" +
    "<p>Hover or click on a region/country/economy to view details.</p>";
}

function nodeHasVisibleChildren(node) {
  var hasChildren = false;

  if (!node) {
    return false;
  }

  try {
    if (typeof node.eachSubnode === "function") {
      node.eachSubnode(function () {
        hasChildren = true;
      });
    }
  } catch (error) {
    hasChildren = false;
  }

  return hasChildren;
}

function createTreeMapOptions(mode, width, height) {
  var options = {
    injectInto: "infovis",
    width: width,
    height: height,

    titleHeight: getResponsiveTitleHeight(mode),
    offset: mode === "cushion" ? 0 : 1,
    animate: animate,
    duration: mode === "cushion" ? 1500 : 800,

    Node: {
      overridable: true,
      color: "#334155",
      CanvasStyles: {
        shadowBlur: 0,
        shadowColor: "#000000",
      },
    },

    Label: {
      type: "HTML",
      size: getResponsiveFontSize(),
      color: "#ffffff",
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
        if (globalTM) {
          globalTM.out();
          resetDetailsPanel();
        }
      },

      onMouseEnter: function () {
        if (globalTM && globalTM.canvas) {
          globalTM.canvas.getElement().style.cursor = "pointer";
        }
      },

      onMouseLeave: function () {
        if (globalTM && globalTM.canvas) {
          globalTM.canvas.getElement().style.cursor = "";
        }
      },
    },

    Tips: {
      enable: true,
      offsetX: 15,
      offsetY: 15,

      onShow: function (tip, node) {
        var data = node.data || {};

        tip.innerHTML =
          "<div class='tip-title'>" +
          node.name +
          "</div>" +
          "<div class='tip-text'>" +
          "<strong>Population:</strong> " +
          formatNumber(data.population || data.$area) +
          "<br>" +
          "<strong>Region:</strong> " +
          (data.region || "Region level") +
          "<br>" +
          "<strong>Income group:</strong> " +
          (data.income_group || "Not available") +
          "</div>";
      },
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
        if (globalTM) {
          globalTM.enter(node);
          showDetails(node);
        }
      };
    },

    onPlaceLabel: function (domElement, node) {
      var labelWidth = parseFloat(domElement.style.width) || 0;
      var labelHeight = parseFloat(domElement.style.height) || 0;
      var fontSize = getResponsiveFontSize();

      var isInternalNode = nodeHasVisibleChildren(node);

      /*
    Cushion mode can overlap parent and child labels.
    Therefore, hide parent/internal labels in Cushion mode.
  */
      if (selectedMode === "cushion" && isInternalNode) {
        domElement.style.display = "none";
        return;
      }

      /*
    On-demand mode should remain clean after entering a region.
    Hide very small labels instead of letting them overlap.
  */
      var minWidth = 60;
      var minHeight = 22;

      if (selectedMode === "cushion") {
        minWidth = 90;
        minHeight = 30;
      }

      if (selectedMode === "ondemand") {
        minWidth = 75;
        minHeight = 24;
      }

      if (labelWidth < minWidth || labelHeight < minHeight) {
        domElement.style.display = "none";
      } else {
        domElement.style.display = "";
        domElement.style.overflow = "hidden";
        domElement.style.whiteSpace = "nowrap";
        domElement.style.textOverflow = "ellipsis";
        domElement.style.color = "#ffffff";
        domElement.style.fontSize = fontSize + "px";
        domElement.style.fontWeight = "bold";
        domElement.style.padding = "3px 5px";
        domElement.style.lineHeight = "1.2";
        domElement.style.textShadow = "0 1px 2px #000000";
      }
    },
  };

  if (mode === "ondemand") {
    options.levelsToShow = 1;

    options.request = function (nodeId, level, onComplete) {
      if (!$jit.json || !$jit.json.getSubtree || !$jit.json.prune) return;

      var subtree = $jit.json.getSubtree(globalCurrentTree, nodeId);

      if (!subtree) return;

      var subtreeCopy = deepClone(subtree);
      $jit.json.prune(subtreeCopy, 1);

      onComplete.onComplete(nodeId, subtreeCopy);
    };
  }

  if (mode === "cushion") {
    options.cushion = useGradients;
  }

  return options;
}

function renderTreeMap(tree) {
  var infovis = document.getElementById("infovis");

  var width = infovis.clientWidth;
  var height = infovis.clientHeight;

  if (width === 0 || height === 0) {
    document.getElementById("details").innerHTML =
      "<h3>Error</h3><p>The visualization container has zero width or height. Check CSS.</p>";
    return;
  }

  infovis.innerHTML = "";

  var treeForMode = getTreeForMode(tree, selectedMode);
  var options = createTreeMapOptions(selectedMode, width, height);

  globalTM = new $jit.TM.Squarified(options);

  globalTM.loadJSON(treeForMode);
  globalTM.refresh();
}

function renderDashboardForSelectedYear() {
  globalCurrentTree = buildTreeForYear(globalTreeData, selectedYear);

  updateDashboardCards(globalCurrentTree);
  updateVisualDescription();
  renderTreeMap(globalCurrentTree);

  document.getElementById("details").innerHTML =
    "<h3>Details</h3>" +
    "<p>Hover or click on a region/country/economy to view details.</p>";
}

function setupModeSelector() {
  var selector = document.getElementById("treemapMode");
  if (!selector) return;

  selector.value = selectedMode;
  updateModeDescription(selectedMode);

  selector.addEventListener("change", function () {
    selectedMode = selector.value;
    updateModeDescription(selectedMode);
    resetDetailsPanel();

    if (globalCurrentTree) {
      setTimeout(function () {
        renderTreeMap(globalCurrentTree);
      }, 50);
    }
  });
}

function init() {
  if (typeof $jit === "undefined") {
    document.getElementById("details").innerHTML =
      "<h3>Error</h3><p>JIT library not loaded. Check js/jit.js path.</p>";
    return;
  }

  setupModeSelector();

  loadJSON("data.json", function (json) {
    globalTreeData = json;

    updateLegend(json);
    setupYearControls(json);
    renderDashboardForSelectedYear();

    document.getElementById("back").onclick = function () {
      if (globalTM) globalTM.out();
      resetDetailsPanel();
    };
  });
}

window.addEventListener("resize", function () {
  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(function () {
    if (globalCurrentTree) {
      renderTreeMap(globalCurrentTree);
    }
  }, 300);
});

function showDetails(node) {
  var data = node.data || {};

  var detailsHTML =
    "<h3>" +
    node.name +
    "</h3>" +
    "<p><strong>Population:</strong> " +
    formatNumber(data.population || data.$area) +
    "</p>" +
    "<p><strong>Region:</strong> " +
    (data.region || "Region level") +
    "</p>";

  /*
    Income group is meaningful for countries/economies,
    but not for region-level nodes.
  */
  if (data.income_group && data.income_group !== "Not available") {
    detailsHTML +=
      "<p><strong>Income group:</strong> " + data.income_group + "</p>";
  }

  detailsHTML +=
    "<p>" + (data.description || "No description available.") + "</p>";

  document.getElementById("details").innerHTML = detailsHTML;
}
