# World Bank Population Dashboard using JIT

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=for-the-badge)](https://wasifalipervez1993-pixel.github.io/worldbank_jit_dashboard/)
![JIT](https://img.shields.io/badge/Visualization-JavaScript%20InfoVis%20Toolkit-orange?style=for-the-badge)
![Dataset](https://img.shields.io/badge/Dataset-World%20Bank%20Population-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Deployed-success?style=for-the-badge)

An interactive dashboard that visualizes the **World Bank Population, total** dataset using the **JavaScript InfoVis Toolkit (JIT)** TreeMap visualization.

The project converts the original World Bank CSV data into a hierarchical JSON structure and displays population values by **World Bank region** and **country/economy**.

---

## Live Application

The dashboard is deployed using GitHub Pages:

**Live URL:**  
https://wasifalipervez1993-pixel.github.io/worldbank_jit_dashboard/

---

## Dashboard Preview

![World Bank JIT Dashboard](screenshots/dashboard.png)

---

## Project Objective

The objective of this project is to explore the JavaScript InfoVis Toolkit and use it to visualize a real-world dataset in JSON format.

The project demonstrates:

- how to select a suitable visualization from JIT,
- how to convert a real dataset into JIT-compatible JSON,
- how to integrate JSON data into a TreeMap,
- how to customize HTML and CSS into a dashboard interface,
- how to add user interaction, tooltips, legends, and filtering options.

---

## Dataset Information

| Item | Description |
|---|---|
| Dataset | World Bank Population, total |
| Indicator | SP.POP.TOTL |
| Source format | CSV |
| Visualization format | JSON |
| Data units | Countries and economies with valid World Bank region metadata |
| Available years | 1960 to 2024 |
| Default year | 2024 |

The data is processed using Python and converted into a hierarchical JSON file named `data.json`.

---

## Visualization Tool

This project uses the **JavaScript InfoVis Toolkit (JIT)**.

The TreeMap is created using:

```javascript
new $jit.TM.Squarified(...)
```

The generated JSON dataset is loaded into the TreeMap using:

```javascript
tm.loadJSON(json)
tm.refresh()
```

This keeps the visualization based on the original JIT TreeMap framework while improving the interface with dashboard-style HTML and CSS.

---

## TreeMap Modes

The dashboard allows users to select different JIT TreeMap display modes.

| Mode | Description |
|---|---|
| Squarified Animated TreeMap | Displays the full hierarchy using JIT Squarified TreeMap animation |
| On-Demand Nodes TreeMap | Starts from higher-level nodes and loads child nodes using JIT request/prune logic |
| Cushion TreeMap | Uses JIT Cushion TreeMap rendering with a depth-like gradient effect |

These modes allow the same population dataset to be explored through different JIT TreeMap configurations.

---

## Year Selection Feature

The dashboard includes a year input option.

Users can enter a valid year from the available range:

```text
1960 to 2024
```

When a valid year is entered, the TreeMap is rebuilt using population values for that year.

If an unavailable year is entered, the dashboard shows an error message and prevents invalid visualization.

---

## Visual Encoding

| Visual Element | Meaning |
|---|---|
| Rectangle area | Population size |
| Color hue | World Bank region |
| Shade intensity | Relative population magnitude within the selected year |
| Tooltip | Country/economy or region details |
| Details panel | Selected node information |

Small labels are hidden when rectangles are too small to avoid clutter. Users can still inspect those entries using hover tooltips or by zooming into the TreeMap.

---

## Dashboard Features

- Live interactive dashboard
- Real-world World Bank dataset
- JIT-compatible JSON integration
- Region color legend
- Year-based filtering
- Multiple JIT TreeMap display modes
- Tooltip-based information display
- Click-to-zoom interaction
- Back/right-click zoom-out support
- Responsive dashboard layout
- Summary cards for key statistics
- Clean dataset information panel

---

## Project Structure

```text
worldbank_jit_dashboard/
│
├── index.html
├── data.json
├── convert_to_jit_json.py
├── README.md
│
├── css/
│   └── style.css
│
├── js/
│   ├── jit.js
│   ├── jit-yc.js
│   └── app.js
│
├── raw_data/
│   ├── API_SP.POP.TOTL_DS2_en_csv_v2_259579.csv
│   ├── Metadata_Country_API_SP.POP.TOTL_DS2_en_csv_v2_259579.csv
│   └── Metadata_Indicator_API_SP.POP.TOTL_DS2_en_csv_v2_259579.csv
│
└── screenshots/
    └── dashboard.png
```

---

## How to Run Locally

### 1. Install pandas

```bash
pip install pandas
```

### 2. Generate the JIT-compatible JSON file

```bash
python convert_to_jit_json.py
```

This generates or updates:

```text
data.json
```

### 3. Start a local server

```bash
python -m http.server 8000
```

### 4. Open the dashboard

```text
http://localhost:8000
```

If the browser still shows an old version, hard refresh the page:

```text
Ctrl + Shift + R
```

---

## Data Processing Output

The conversion script produces output similar to:

```text
Default/latest year selected: 2024
JIT-compatible JSON saved as: data.json
Total countries/economies included: 217
Total regions included: 7
Available years included: 1960 to 2024
```

The exact values may depend on the downloaded version of the World Bank dataset.

---

## JSON Structure

The generated `data.json` follows the hierarchical structure required by JIT TreeMap.

```text
Root
└── World Bank Region
    └── Country/Economy
```

Each node contains:

| Field | Purpose |
|---|---|
| id | Unique node identifier |
| name | Display name |
| data | Population, color, region, income group, and yearly values |
| children | Child nodes |

Important JIT data fields include:

```json
"$area"
```

Controls the rectangle size.

```json
"$color"
```

Controls the rectangle color.

The JSON also stores yearly population values, allowing the dashboard to rebuild the TreeMap for a selected year.

---

## Interaction Guide

- Hover over a rectangle to view tooltip details.
- Click a region or country/economy to zoom in.
- Right-click or press the Back button to zoom out.
- Enter a valid year and click Apply to update the TreeMap.
- Use the TreeMap Mode selector to switch between JIT TreeMap styles.

---

## Deployment

The project is deployed using GitHub Pages.

Live deployment:

```text
https://wasifalipervez1993-pixel.github.io/worldbank_jit_dashboard/
```

Since this is a static dashboard, GitHub Pages can serve the application directly from the repository.

---

## Notes and Limitations

- The regional grouping follows the World Bank metadata file.
- Some countries/economies may appear under regions that differ from common geographic expectations because the official metadata is used.
- Very small labels are hidden to maintain readability.
- The Python script is only required for generating `data.json`; the deployed dashboard runs as a static web application.
- GitHub Pages does not run Python code, so `data.json` must be generated before deployment.

---

## Technologies Used

- HTML
- CSS
- JavaScript
- JavaScript InfoVis Toolkit
- Python
- pandas
- GitHub Pages

---

## Conclusion

This project demonstrates how the JavaScript InfoVis Toolkit can be used to visualize a real-world dataset through an interactive TreeMap dashboard.

The final dashboard satisfies the assignment requirements by:

- using a JIT visualization,
- converting a real dataset into JSON,
- integrating the JSON dataset into the TreeMap,
- customizing the HTML/CSS layout,
- adding a banner, description, legend, details panel, and dashboard controls,
- deploying the application online using GitHub Pages.
