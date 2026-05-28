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
