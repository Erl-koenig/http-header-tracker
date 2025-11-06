# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "pandas",
#     "openpyxl",
# ]
# ///
import json
import sys
from collections import defaultdict

import pandas as pd

if len(sys.argv) < 2:
    print("Usage: uv run merge_headers.py <json_file1> <json_file2> [json_file3] ...")
    sys.exit(1)

all_data = []
for json_file in sys.argv[1:]:
    try:
        print(f"Loading {json_file}...")
        with open(json_file, "r") as f:
            data = json.load(f)
            all_data.extend(data)
            print(f"  ✓ Loaded {len(data)} entries")
    except FileNotFoundError:
        print(f"  ✗ Error: File not found - {json_file}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"  ✗ Error: Invalid JSON in {json_file} - {e}")
        sys.exit(1)

print(f"\nTotal entries loaded: {len(all_data)}")

# Separate by type and aggregate
request_pairs = defaultdict(int)  # (name, value) -> count
request_names = defaultdict(int)  # name -> count
response_pairs = defaultdict(int)
response_names = defaultdict(int)

for entry in all_data:
    name = entry["name"]
    value = entry["value"]
    count = entry["count"]
    entry_type = entry["type"]

    # (anonymized) values are name-only
    is_anonymized = value == "(anonymized)"

    if entry_type == "request":
        request_names[name] += count
        if not is_anonymized:
            request_pairs[(name, value)] += count

    elif entry_type == "response":
        response_names[name] += count
        if not is_anonymized:
            response_pairs[(name, value)] += count

# 1. Request Complete Pairs (sorted by count)
request_pairs_list = [
    {"Header Name": name, "Header Value": value, "Count": count}
    for (name, value), count in sorted(
        request_pairs.items(), key=lambda x: x[1], reverse=True
    )
]

# 2. Request Name-Only (sorted by count)
request_names_list = [
    {"Header Name": name, "Count": count}
    for name, count in sorted(request_names.items(), key=lambda x: x[1], reverse=True)
]

# 3. Response Complete Pairs (sorted by count)
response_pairs_list = [
    {"Header Name": name, "Header Value": value, "Count": count}
    for (name, value), count in sorted(
        response_pairs.items(), key=lambda x: x[1], reverse=True
    )
]

# 4. Response Name-Only (sorted by count)
response_names_list = [
    {"Header Name": name, "Count": count}
    for name, count in sorted(response_names.items(), key=lambda x: x[1], reverse=True)
]

df_req_pairs = pd.DataFrame(request_pairs_list)
df_req_names = pd.DataFrame(request_names_list)
df_resp_pairs = pd.DataFrame(response_pairs_list)
df_resp_names = pd.DataFrame(response_names_list)

output_file = "header_analysis.xlsx"

with pd.ExcelWriter(output_file, engine="openpyxl") as writer:  # type: ignore
    df_req_pairs.to_excel(writer, sheet_name="Request Complete Pairs", index=False)
    df_req_names.to_excel(writer, sheet_name="Request Name Only", index=False)
    df_resp_pairs.to_excel(writer, sheet_name="Response Complete Pairs", index=False)
    df_resp_names.to_excel(writer, sheet_name="Response Name Only", index=False)
    summary_data = {
        "Category": [
            "Request Complete Pairs (Unique)",
            "Request Complete Pairs (Total Count)",
            "Request Name Only (Unique)",
            "Request Name Only (Total Count)",
            "Response Complete Pairs (Unique)",
            "Response Complete Pairs (Total Count)",
            "Response Name Only (Unique)",
            "Response Name Only (Total Count)",
        ],
        "Value": [
            len(request_pairs),
            sum(request_pairs.values()),
            len(request_names),
            sum(request_names.values()),
            len(response_pairs),
            sum(response_pairs.values()),
            len(response_names),
            sum(response_names.values()),
        ],
    }
    df_summary = pd.DataFrame(summary_data)
    df_summary.to_excel(writer, sheet_name="Summary", index=False)

    # Auto-adjust column widths
    for sheet_name in writer.sheets:
        worksheet = writer.sheets[sheet_name]
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except (AttributeError, TypeError):
                    pass
            adjusted_width = min(max_length + 2, 80)
            worksheet.column_dimensions[column_letter].width = adjusted_width

print(f"✓ Excel file created: {output_file}")
print("\nSummary:")
print(
    f"  Request Complete Pairs: {len(request_pairs)} unique ({sum(request_pairs.values())} total)"
)
print(
    f"  Request Name Only: {len(request_names)} unique ({sum(request_names.values())} total)"
)
print(
    f"  Response Complete Pairs: {len(response_pairs)} unique ({sum(response_pairs.values())} total)"
)
print(
    f"  Response Name Only: {len(response_names)} unique ({sum(response_names.values())} total)"
)
