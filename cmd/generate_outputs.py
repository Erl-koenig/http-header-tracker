#!/usr/bin/env python3
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "pandas",
#     "openpyxl",
# ]
# ///
"""
Generate static header tables in multiple formats (Go, Markdown, JSON).

Source: Excel file with header data
Outputs:
  - headers.go
  - headers.md
  - static-header-table.json

Usage:
  uv run generate_outputs.py
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

QH_VERSION = "0.1.0"
PROTOCOL_VERSION = "QH/0"
SLOTS_TOTAL = 255


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


def generate_json(sheets):
    """Generate JSON format output file."""

    req_complete = sheets["request_complete"]
    req_names = sheets["request_names"]
    resp_complete = sheets["response_complete"]
    resp_names = sheets["response_names"]

    def build_headers(complete_df, names_df):
        """Build header array with both complete pairs and name-only entries."""
        headers = []
        header_id = 1

        # Complete pairs (Format 1)
        for _, row in complete_df.iterrows():
            headers.append(
                {
                    "id": f"0x{header_id:02X}",
                    "id_dec": header_id,
                    "type": "complete_pair",
                    "name": str(row["Header Name"]).lower(),
                    "value": str(row["Header Value"]),
                }
            )
            header_id += 1

        # Name only (Format 2)
        for _, row in names_df.iterrows():
            headers.append(
                {
                    "id": f"0x{header_id:02X}",
                    "id_dec": header_id,
                    "type": "name_only",
                    "name": str(row["Header Name"]).lower(),
                }
            )
            header_id += 1

        return headers

    json_data = {
        "version": QH_VERSION,
        "protocol_version": PROTOCOL_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generator": "https://github.com/Erl-koenig/http-header-tracker",
        "description": "Static header table for QH protocol. Format 1 (complete_pair) uses a single byte ID. Format 2 (name_only) requires ID + value length + value.",
        "request_headers": {
            "slots_used": len(req_complete) + len(req_names),
            "slots_total": SLOTS_TOTAL,
            "headers": build_headers(req_complete, req_names),
        },
        "response_headers": {
            "slots_used": len(resp_complete) + len(resp_names),
            "slots_total": SLOTS_TOTAL,
            "headers": build_headers(resp_complete, resp_names),
        },
    }

    return json.dumps(json_data, indent=2, ensure_ascii=False)


def generate_markdown_table(sheets):
    """Generate markdown documentation with header tables."""

    # Request Complete Pairs
    req_complete = sheets["request_complete"]
    req_names = sheets["request_names"]
    total_req_headers = len(req_complete) + len(req_names)

    md_content = f"""## Request Headers

This file was generated using the `generate_outputs.py` script: https://github.com/Erl-koenig/http-header-tracker

**Slot usage: {total_req_headers}/255**

Complete key-value pairs (Format 1) use a single byte. Name-only headers (Format 2) include the value after the header ID.

| Header ID | Type | Header Name | Header Value |
|-----------|------|-------------|--------------|
"""

    header_id = 1
    for _, row in req_complete.iterrows():
        name = str(row["Header Name"]).lower()
        value = row["Header Value"]
        md_content += f"| 0x{header_id:02X} | Complete Pair | {name} | {value} |\n"
        header_id += 1

    # Request Name Only, continue sequential IDs
    for _, row in req_names.iterrows():
        name = str(row["Header Name"]).lower()
        md_content += f"| 0x{header_id:02X} | Name Only | {name} | (variable) |\n"
        header_id += 1

    # Response Complete Pairs
    resp_complete = sheets["response_complete"]
    resp_names = sheets["response_names"]
    total_resp_headers = len(resp_complete) + len(resp_names)

    md_content += "\n## Response Headers\n\n"
    md_content += f"**Slot usage: {total_resp_headers}/255**\n\n"
    md_content += "Complete key-value pairs (Format 1) use a single byte. Name-only headers (Format 2) include the value after the header ID.\n\n"
    md_content += "| Header ID | Type | Header Name | Header Value |\n"
    md_content += "|-----------|------|-------------|--------------|\n"

    header_id = 1
    for _, row in resp_complete.iterrows():
        name = str(row["Header Name"]).lower()
        value = row["Header Value"]
        md_content += f"| 0x{header_id:02X} | Complete Pair | {name} | {value} |\n"
        header_id += 1

    # Response Name Only, continue sequential IDs
    for _, row in resp_names.iterrows():
        name = str(row["Header Name"]).lower()
        md_content += f"| 0x{header_id:02X} | Name Only | {name} | (variable) |\n"
        header_id += 1

    return md_content


def generate_go_code(sheets):
    """Generate Go code with 6 pre-built header tables."""

    go_content = """// Code generated by generate_outputs.py script. DO NOT EDIT. https://github.com/Erl-koenig/http-header-tracker

package qh

type headerEntry struct {
\tname  string
\tvalue string // empty for name-only headers (Format 2)
}

"""

    req_complete = sheets["request_complete"]
    req_names = sheets["request_names"]
    resp_complete = sheets["response_complete"]
    resp_names = sheets["response_names"]

    # DECODING TABLE 1: Request headers (byte ID → header entry)
    go_content += "// DECODING: Maps request header IDs to entries (check entry.value: empty=Format2, non-empty=Format1)\n"
    go_content += "var requestHeaderStaticTable = map[byte]headerEntry{\n"
    go_content += "\t// Complete key-value pairs (Format 1)\n"

    header_id = 1
    for _, row in req_complete.iterrows():
        name = str(row["Header Name"]).lower()
        value = str(row["Header Value"]).replace("\\", "\\\\").replace('"', '\\"')
        go_content += f'\t0x{header_id:02X}: {{"{name}", "{value}"}},\n'
        header_id += 1

    go_content += "\n\t// Name-only headers (Format 2)\n"
    for _, row in req_names.iterrows():
        name = str(row["Header Name"]).lower()
        go_content += f'\t0x{header_id:02X}: {{"{name}", ""}},\n'
        header_id += 1

    go_content += "}\n\n"

    # DECODING TABLE 2: Response headers (byte ID → header entry)
    go_content += "// DECODING: Maps response header IDs to entries (check entry.value: empty=Format2, non-empty=Format1)\n"
    go_content += "var responseHeaderStaticTable = map[byte]headerEntry{\n"
    go_content += "\t// Complete key-value pairs (Format 1)\n"

    header_id = 1
    for _, row in resp_complete.iterrows():
        name = str(row["Header Name"]).lower()
        value = str(row["Header Value"]).replace("\\", "\\\\").replace('"', '\\"')
        go_content += f'\t0x{header_id:02X}: {{"{name}", "{value}"}},\n'
        header_id += 1

    go_content += "\n\t// Name-only headers (Format 2)\n"
    for _, row in resp_names.iterrows():
        name = str(row["Header Name"]).lower()
        go_content += f'\t0x{header_id:02X}: {{"{name}", ""}},\n'
        header_id += 1

    go_content += "}\n\n"

    # ENCODING TABLE 1: Request complete pairs
    go_content += "// ENCODING: Maps request header pairs (name:value) to IDs for Format 1 (single byte)\n"
    go_content += "var requestHeaderCompletePairs = map[string]byte{\n"
    header_id = 1
    for _, row in req_complete.iterrows():
        name = str(row["Header Name"]).lower()
        value = str(row["Header Value"]).replace("\\", "\\\\").replace('"', '\\"')
        go_content += f'\t"{name}:{value}": 0x{header_id:02X},\n'
        header_id += 1
    go_content += "}\n\n"

    # ENCODING TABLE 2: Request name-only
    go_content += "// ENCODING: Maps request header names to IDs for Format 2 (ID + varint + value)\n"
    go_content += "var requestHeaderNameOnly = map[string]byte{\n"
    for _, row in req_names.iterrows():
        name = str(row["Header Name"]).lower()
        go_content += f'\t"{name}": 0x{header_id:02X},\n'
        header_id += 1
    go_content += "}\n\n"

    # ENCODING TABLE 3: Response complete pairs
    go_content += "// ENCODING: Maps response header pairs (name:value) to IDs for Format 1 (single byte)\n"
    go_content += "var responseHeaderCompletePairs = map[string]byte{\n"
    header_id = 1
    for _, row in resp_complete.iterrows():
        name = str(row["Header Name"]).lower()
        value = str(row["Header Value"]).replace("\\", "\\\\").replace('"', '\\"')
        go_content += f'\t"{name}:{value}": 0x{header_id:02X},\n'
        header_id += 1
    go_content += "}\n\n"

    # ENCODING TABLE 4: Response name-only
    go_content += "// ENCODING: Maps response header names to IDs for Format 2 (ID + varint + value)\n"
    go_content += "var responseHeaderNameOnly = map[string]byte{\n"
    for _, row in resp_names.iterrows():
        name = str(row["Header Name"]).lower()
        go_content += f'\t"{name}": 0x{header_id:02X},\n'
        header_id += 1
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

    print("\nGenerating outputs...")

    md_content = generate_markdown_table(filtered_sheets)
    md_file = "static-tables.md"
    with open(md_file, "w", encoding="utf-8") as f:
        f.write(md_content)

    go_content = generate_go_code(filtered_sheets)
    go_file = "headers.go"
    with open(go_file, "w", encoding="utf-8") as f:
        f.write(go_content)

    json_content = generate_json(filtered_sheets)
    json_file = "static-header-table.json"
    with open(json_file, "w", encoding="utf-8") as f:
        f.write(json_content)

    print("\nDone! Generated files:")
    print(f"   • {md_file}")
    print(f"   • {go_file}")
    print(f"   • {json_file}")
    print("\nNote: All header names have been normalized to lowercase")


if __name__ == "__main__":
    main()
