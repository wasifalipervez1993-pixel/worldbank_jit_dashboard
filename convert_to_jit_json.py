import json
import pandas as pd
from pathlib import Path


BASE_DIR = Path(__file__).parent

population_file = BASE_DIR / "raw_data" / "API_SP.POP.TOTL_DS2_en_csv_v2_259579.csv"
metadata_file = BASE_DIR / "raw_data" / "Metadata_Country_API_SP.POP.TOTL_DS2_en_csv_v2_259579.csv"
output_file = BASE_DIR / "data.json"


population_df = pd.read_csv(population_file, skiprows=4)
metadata_df = pd.read_csv(metadata_file)


year_columns = [col for col in population_df.columns if col.isdigit()]
year_columns = sorted(year_columns, key=lambda x: int(x))


population_df = population_df[
    ["Country Name", "Country Code"] + year_columns
].rename(columns={
    "Country Name": "country",
    "Country Code": "country_code"
})

metadata_df = metadata_df[
    ["Country Code", "Region", "IncomeGroup"]
].rename(columns={
    "Country Code": "country_code",
    "Region": "region",
    "IncomeGroup": "income_group"
})


df = population_df.merge(metadata_df, on="country_code", how="left")

# Remove World Bank aggregate rows such as World, High income, Low income, etc.
df = df.dropna(subset=["region"])
df = df[df["region"].astype(str).str.strip() != ""]

df[year_columns] = df[year_columns].apply(pd.to_numeric, errors="coerce")


available_years = []

for year in year_columns:
    values = df[year]
    if values.notna().sum() > 0 and (values > 0).sum() > 0:
        available_years.append(year)

if not available_years:
    raise ValueError("No valid population year columns found.")

min_year = available_years[0]
max_year = available_years[-1]
latest_year = max_year

print(f"Available year range: {min_year} to {max_year}")
print(f"Default/latest year selected: {latest_year}")


df["has_any_population"] = df[available_years].gt(0).any(axis=1)
df = df[df["has_any_population"]].copy()

df = df.sort_values(by=["region", latest_year], ascending=[True, False])


region_colors = {
    "East Asia & Pacific": "#76B7B2",
    "Europe & Central Asia": "#F28E2B",
    "Latin America & Caribbean": "#EDC948",
    "Middle East & North Africa": "#E15759",
    "North America": "#B07AA1",
    "South Asia": "#4E79A7",
    "Sub-Saharan Africa": "#59A14F"
}


def population_dict_from_row(row):
    pop_dict = {}

    for year in available_years:
        value = row[year]

        if pd.notna(value) and value > 0:
            pop_dict[year] = int(value)

    return pop_dict


def sum_population_for_year(rows, year):
    values = pd.to_numeric(rows[year], errors="coerce")
    return int(values[values > 0].sum())


root_population_latest = sum_population_for_year(df, latest_year)

root = {
    "id": "root",
    "name": f"World Population by Region ({latest_year})",
    "data": {
        "$area": root_population_latest,
        "population": root_population_latest,
        "year": latest_year,
        "available_years": available_years,
        "min_year": min_year,
        "max_year": max_year,
        "region_colors": region_colors,
        "description": f"World Bank population dataset. Available years: {min_year} to {max_year}."
    },
    "children": []
}


for region, region_df in df.groupby("region"):
    region_population_latest = sum_population_for_year(region_df, latest_year)

    region_populations = {}
    for year in available_years:
        year_population = sum_population_for_year(region_df, year)
        if year_population > 0:
            region_populations[year] = year_population

    region_node = {
        "id": region.lower()
                    .replace(" ", "_")
                    .replace("&", "and")
                    .replace("-", "_"),
        "name": region,
        "data": {
            "$area": region_population_latest,
            "$color": region_colors.get(region, "#999999"),
            "base_color": region_colors.get(region, "#999999"),
            "population": region_population_latest,
            "populations": region_populations,
            "region": region,
            "income_group": "Not available",
            "description": f"Total population of {region}"
        },
        "children": []
    }

    for _, row in region_df.iterrows():
        country_populations = population_dict_from_row(row)

        if not country_populations:
            continue

        latest_population = country_populations.get(latest_year, 1)

        country_node = {
            "id": row["country_code"],
            "name": row["country"],
            "data": {
                "$area": latest_population,
                "$color": region_colors.get(row["region"], "#999999"),
                "base_color": region_colors.get(row["region"], "#999999"),
                "population": latest_population,
                "populations": country_populations,
                "region": row["region"],
                "income_group": row["income_group"] if pd.notna(row["income_group"]) else "Not available",
                "description": f"{row['country']} population in {latest_year}"
            },
            "children": []
        }

        region_node["children"].append(country_node)

    root["children"].append(region_node)


with open(output_file, "w", encoding="utf-8") as f:
    json.dump(root, f, indent=2, ensure_ascii=False)

print(f"JIT-compatible JSON saved as: {output_file}")
print(f"Total countries/economies included: {len(df)}")
print(f"Total regions included: {df['region'].nunique()}")
print(f"Available years included: {min_year} to {max_year}")