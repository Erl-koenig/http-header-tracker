# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "pandas",
#     "openpyxl",
# ]
# ///
import sys
from pathlib import Path

import pandas as pd


def read_excel_sheets(excel_file):
    """Read the four header sheets from the Excel file."""
    try:
        req_complete_pairs = pd.read_excel(
            excel_file, sheet_name="Request Complete Pairs"
        )
        req_name_only = pd.read_excel(excel_file, sheet_name="Request Name Only")
        resp_complete_pairs = pd.read_excel(
            excel_file, sheet_name="Response Complete Pairs"
        )
        resp_name_only = pd.read_excel(excel_file, sheet_name="Response Name Only")

        return {
            "request_complete": req_complete_pairs,
            "request_names": req_name_only,
            "response_complete": resp_complete_pairs,
            "response_names": resp_name_only,
        }
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        sys.exit(1)


def filter_keep_status(df):
    """Filter dataframe to only include rows with Status='keep'."""
    if "Status" not in df.columns:
        return df

    return df[df["Status"] == "keep"]


def generate_markdown_table(sheets):
    """Generate markdown documentation with header tables."""

    # Request Complete Pairs
    req_complete = sheets["request_complete"]
    req_names = sheets["request_names"]
    total_req_headers = len(req_complete) + len(req_names)

    md_content = f"""## Request Headers

**Slot usage: {total_req_headers}/255**

Complete key-value pairs (Format 1) use a single byte. Name-only headers (Format 2) include the value after the header ID.

| Header ID | Type | Header Name | Header Value |
|-----------|------|-------------|--------------|
"""

    header_id = 1
    for _, row in req_complete.iterrows():
        name = row["Header Name"]
        value = row["Header Value"]
        md_content += f"| 0x{header_id:02X} | Complete Pair | {name} | {value} |\n"
        header_id += 1

    # Request Name Only, continue sequential IDs
    for _, row in req_names.iterrows():
        name = row["Header Name"]
        md_content += f"| 0x{header_id:02X} | Name Only | {name} | (variable) |\n"
        header_id += 1

    # Response Complete Pairs
    resp_complete = sheets["response_complete"]
    resp_names = sheets["response_names"]
    total_resp_headers = len(resp_complete) + len(resp_names)

    md_content += f"\n## Response Headers\n\n"
    md_content += f"**Slot usage: {total_resp_headers}/255**\n\n"
    md_content += "Complete key-value pairs (Format 1) use a single byte. Name-only headers (Format 2) include the value after the header ID.\n\n"
    md_content += "| Header ID | Type | Header Name | Header Value |\n"
    md_content += "|-----------|------|-------------|--------------|\n"

    header_id = 1
    for _, row in resp_complete.iterrows():
        name = row["Header Name"]
        value = row["Header Value"]
        md_content += f"| 0x{header_id:02X} | Complete Pair | {name} | {value} |\n"
        header_id += 1

    # Response Name Only, continue sequential IDs
    for _, row in resp_names.iterrows():
        name = row["Header Name"]
        md_content += f"| 0x{header_id:02X} | Name Only | {name} | (variable) |\n"
        header_id += 1

    return md_content


def generate_go_code(sheets):
    """Generate Go code with header constants and tables."""

    go_content = """package qh

type HeaderPair struct {
	Key   string
	Value string
}

"""

    # Request Headers - Combined table
    req_complete = sheets["request_complete"]
    req_names = sheets["request_names"]
    total_req_headers = len(req_complete) + len(req_names)

    # Request complete pairs slice
    go_content += f"// Request complete key-value pairs (Format 1) - {total_req_headers}/255 slots used\n"
    go_content += "// Index 0 is reserved for CustomHeader\n"
    go_content += "// IDs 1 to N are complete pairs, N+1 to 255 are name-only headers\n"
    go_content += "var requestHeaderCompletePairs = []HeaderPair{\n"
    go_content += "\t{}, // Index 0 reserved\n"

    header_id = 1
    for _, row in req_complete.iterrows():
        name = row["Header Name"]
        value = row["Header Value"]
        value_escaped = str(value).replace("\\", "\\\\").replace('"', '\\"')
        go_content += f'\t{{"{name}", "{value_escaped}"}}, // ID 0x{header_id:02X}\n'
        header_id += 1

    go_content += "}\n\n"

    go_content += "// Reverse lookup for encoding request complete pairs (Format 1)\n"
    go_content += "var requestHeaderCompleteLookup map[string]byte\n\n"

    go_content += "var requestHeaderTable = map[string]byte{\n"

    for _, row in req_names.iterrows():
        name = row["Header Name"]
        go_content += f'\t"{name}": 0x{header_id:02X},\n'
        header_id += 1

    go_content += "}\n\n"

    # Response Headers - Combined table
    resp_complete = sheets["response_complete"]
    resp_names = sheets["response_names"]
    total_resp_headers = len(resp_complete) + len(resp_names)

    # Response complete pairs slice
    go_content += f"// Response complete key-value pairs (Format 1) - {total_resp_headers}/255 slots used\n"
    go_content += "// Index 0 is reserved for CustomHeader\n"
    go_content += "// IDs 1 to N are complete pairs, N+1 to 255 are name-only headers\n"
    go_content += "var responseHeaderCompletePairs = []HeaderPair{\n"
    go_content += "\t{}, // Index 0 reserved\n"

    header_id = 1
    for _, row in resp_complete.iterrows():
        name = row["Header Name"]
        value = row["Header Value"]
        value_escaped = str(value).replace("\\", "\\\\").replace('"', '\\"')
        go_content += f'\t{{"{name}", "{value_escaped}"}}, // ID 0x{header_id:02X}\n'
        header_id += 1

    go_content += "}\n\n"

    go_content += "// Reverse lookup for encoding response complete pairs (Format 1)\n"
    go_content += "var responseHeaderCompleteLookup map[string]byte\n\n"

    go_content += "var responseHeaderTable = map[string]byte{\n"

    for _, row in resp_names.iterrows():
        name = row["Header Name"]
        go_content += f'\t"{name}": 0x{header_id:02X},\n'
        header_id += 1

    go_content += "}\n\n"

    go_content += "func init() {\n"
    go_content += "\trequestHeaderCompleteLookup = make(map[string]byte)\n"
    go_content += "\tfor i, pair := range requestHeaderCompletePairs {\n"
    go_content += "\t\tif i == 0 {\n"
    go_content += "\t\t\tcontinue\n"
    go_content += "\t\t}\n"
    go_content += '\t\tkey := pair.Key + ":" + pair.Value\n'
    go_content += "\t\trequestHeaderCompleteLookup[key] = byte(i)\n"
    go_content += "\t}\n\n"

    go_content += "\tresponseHeaderCompleteLookup = make(map[string]byte)\n"
    go_content += "\tfor i, pair := range responseHeaderCompletePairs {\n"
    go_content += "\t\tif i == 0 {\n"
    go_content += "\t\t\tcontinue\n"
    go_content += "\t\t}\n"
    go_content += '\t\tkey := pair.Key + ":" + pair.Value\n'
    go_content += "\t\tresponseHeaderCompleteLookup[key] = byte(i)\n"
    go_content += "\t}\n"
    go_content += "}\n"

    return go_content


def main():
    excel_files = list(Path(".").glob("*.xlsx"))  # look for .xlsx files in current dir

    if not excel_files:
        print("Error: No Excel file found in current directory")
        print("Ensure you have an Excel file with the required sheets:")
        print("  - Request Complete Pairs")
        print("  - Request Name Only")
        print("  - Response Complete Pairs")
        print("  - Response Name Only")
        sys.exit(1)

    if len(excel_files) > 1:
        print("Multiple Excel files found. Using:", excel_files[0])

    excel_file = excel_files[0]
    print(f"Reading from: {excel_file}")

    sheets = read_excel_sheets(excel_file)

    filtered_sheets = {
        "request_complete": filter_keep_status(sheets["request_complete"]),
        "request_names": filter_keep_status(sheets["request_names"]),
        "response_complete": filter_keep_status(sheets["response_complete"]),
        "response_names": filter_keep_status(sheets["response_names"]),
    }

    print("Generating markdown documentation...")
    md_content = generate_markdown_table(filtered_sheets)
    md_file = "headers.md"
    with open(md_file, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"✓ Created: {md_file}")

    print("Generating Go code...")
    go_content = generate_go_code(filtered_sheets)
    go_file = "headers.go"
    with open(go_file, "w", encoding="utf-8") as f:
        f.write(go_content)
    print(f"✓ Created: {go_file}")

    print("\nDone! Generated files:")
    print(f"  - {md_file} (documentation)")
    print(f"  - {go_file} (Go code)")


if __name__ == "__main__":
    main()
