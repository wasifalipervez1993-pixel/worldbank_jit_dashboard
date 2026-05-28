import json
import pandas as pd
from pathlib import Path


# -----------------------------
# File paths
# -----------------------------
BASE_DIR = Path(__file__).parent

population_file = BASE_DIR / "raw_data" / "API_SP.POP.TOTL_DS2_en_csv_v2_259579.csv"
metadata_file = BASE_DIR / "raw_data" / "Metadata_Country_API_SP.POP.TOTL_DS2_en_csv_v2_259579.csv"
output_file = BASE_DIR / "data.json"


# -----------------------------
# Load World Bank CSV files
# -----------------------------
population_df = pd.read_csv(population_file, skiprows=4)
metadata_df = pd.read_csv(metadata_file)


# -----------------------------
# Identify latest available year with actual data
# -----------------------------
year_columns = [col for col in population_df.columns if col.isdigit()]
year_columns_sorted = sorted([int(y) for y in year_columns])

latest_year = None

for year in reversed(year_columns_sorted):
    year_str = str(year)

    # Select the latest year that actually has non-null population values.
    # Some World Bank downloads include a future/empty year column.
    if population_df[year_str].notna().sum() > 0:
        latest_year = year_str
        break

if latest_year is None:
    raise ValueError("No year columns with actual data found.")

print(f"Latest available year detected: {latest_year}")


# -----------------------------
# Keep useful columns
# -----------------------------
population_df = population_df[
    ["Country Name", "Country Code", latest_year]
].rename(columns={
    "Country Name": "country",
    "Country Code": "country_code",
    latest_year: "population"
})

metadata_df = metadata_df[
    ["Country Code", "Region", "IncomeGroup"]
].rename(columns={
    "Country Code": "country_code",
    "Region": "region",
    "IncomeGroup": "income_group"
})


# -----------------------------
# Merge population values with World Bank country/economy metadata
# -----------------------------
df = population_df.merge(metadata_df, on="country_code", how="left")


# -----------------------------
# Clean dataset
# -----------------------------
# Remove aggregate rows such as World, High income, Low income, etc.
# These rows do not have a valid World Bank region in the metadata file.
df = df.dropna(subset=["region"])
df = df[df["region"].astype(str).str.strip() != ""]

# Remove rows with missing or zero population values.
df = df.dropna(subset=["population"])
df = df[df["population"] > 0]

# Convert population to integer.
df["population"] = df["population"].astype(int)

# Sort by region and then by population to keep the TreeMap readable.
df = df.sort_values(by=["region", "population"], ascending=[True, False])


# -----------------------------
# Region color encoding
# -----------------------------
# Area = population.
# Color = World Bank region.
# These colors are stored in the JIT JSON using the $color field.
region_colors = {
    "East Asia & Pacific": "#76B7B2",
    "Europe & Central Asia": "#F28E2B",
    "Latin America & Caribbean": "#EDC948",
    "Middle East & North Africa": "#E15759",
    "North America": "#B07AA1",
    "South Asia": "#4E79A7",
    "Sub-Saharan Africa": "#59A14F"
}


# -----------------------------
# Build JIT TreeMap JSON
# -----------------------------
root = {
    "id": "root",
    "name": f"World Population by Region ({latest_year})",
    "data": {
        "$area": int(df["population"].sum()),
        "population": int(df["population"].sum()),
        "year": latest_year,
        "region_colors": region_colors,
        "description": f"World Bank population dataset for {latest_year}"
    },
    "children": []
}


for region, region_df in df.groupby("region"):
    region_population = int(region_df["population"].sum())

    region_node = {
        "id": region.lower()
                    .replace(" ", "_")
                    .replace("&", "and")
                    .replace("-", "_"),
        "name": region,
        "data": {
            "$area": region_population,
            "$color": region_colors.get(region, "#999999"),
            "population": region_population,
            "region": region,
            "description": f"Total population of {region}"
        },
        "children": []
    }

    for _, row in region_df.iterrows():
        country_population = int(row["population"])

        country_node = {
            "id": row["country_code"],
            "name": row["country"],
            "data": {
                "$area": country_population,
                "$color": region_colors.get(row["region"], "#999999"),
                "population": country_population,
                "region": row["region"],
                "income_group": row["income_group"] if pd.notna(row["income_group"]) else "Not available",
                "description": f"{row['country']} population in {latest_year}"
            },
            "children": []
        }

        region_node["children"].append(country_node)

    root["children"].append(region_node)


# -----------------------------
# Save JSON
# -----------------------------
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(root, f, indent=2, ensure_ascii=False)

print(f"JIT-compatible JSON saved as: {output_file}")
print(f"Population covered: {int(df['population'].sum()):,}")
print(f"Countries/economies included: {len(df)}")
print(f"World Bank regions included: {df['region'].nunique()}")
