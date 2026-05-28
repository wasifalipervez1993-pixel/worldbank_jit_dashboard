# World Bank Population Dashboard using JIT

This project visualizes a real-world World Bank Population, total dataset using the JavaScript InfoVis Toolkit (JIT) Squarified TreeMap.

## How to run

1. Install pandas if needed:

```bash
pip install pandas
```

2. Generate the JIT-compatible JSON file:

```bash
python convert_to_jit_json.py
```

3. Start a local server:

```bash
python -m http.server 8000
```

4. Open this URL in the browser:

```text
http://localhost:8000
```

## Encoding

- Rectangle area = population value.
- Rectangle color = World Bank region.
- Tooltip and details panel show population, region, and income group.

Small country/economy labels are intentionally hidden when rectangles are too small. Users can hover or zoom in to inspect details.

## Data Processing Output

The conversion script generates the following statistics:

```
Latest available year detected: 2024
JIT-compatible JSON saved as: data.json
Population covered: 8,118,396,046
Countries/economies included: 217
World Bank regions included: 7
```

This data represents the most comprehensive and up-to-date global population dataset from the World Bank API.

## Dashboard Visualization

![World Bank JIT Dashboard](screenshots/dashboard.png)

The interactive dashboard displays world population data in a Squarified TreeMap format, with each rectangle representing a country/economy sized proportionally to its population.

### UI/UX Features

- **Sticky Legend**: The region color legend remains visible while scrolling through the visualization
- **Responsive Design**: Fully responsive layout that works on desktop, tablet, and mobile devices
- **Interactive TreeMap**: Click to zoom in, right-click or use Back button to zoom out
- **Real-time Tooltips**: Hover over regions to see detailed information (population, region, income group)
- **Color-coded Regions**: Each World Bank region is represented by a distinct color for easy identification
- **Professional Styling**: Clean, modern interface with gradient accents and subtle shadows
