import argparse
import json
import sys
import csv
from datetime import datetime
from collections import defaultdict


def print_top_headers(stats_file, top_n=10):
    try:
        with open(stats_file, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: The file '{stats_file}' was not found.", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from '{stats_file}'.", file=sys.stderr)
        sys.exit(1)
    except IOError as e:
        print(f"Error reading file '{stats_file}': {e}", file=sys.stderr)
        sys.exit(1)

    header_counts = defaultdict(int)
    for item in data:
        # Aggregate counts, treating header names as case-insensitive
        if "name" in item and "count" in item:
            header_counts[item["name"].lower()] += item["count"]
        else:
            print(f"Warning: Skipping malformed item in JSON: {item}", file=sys.stderr)

    # Convert to a list of tuples and sort by count in descending order
    sorted_headers = sorted(header_counts.items(), key=lambda x: x[1], reverse=True)

    print(f"Top {min(top_n, len(sorted_headers))} headers from '{stats_file}':")
    for name, count in sorted_headers[:top_n]:
        print(f"{count:>8} {name}")

def print_header_counts(stats_file, header_name):
    try:
        with open(stats_file, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: The file '{stats_file}' was not found.", file=sys.stderr)
        sys.exit(1)
    totalcount = 0
    for item in data:
        if item.get("name", "").lower() == header_name.lower():
            totalcount += item.get("count", 0)
    if totalcount > 0:
        print(f"Total count for header '{header_name}' in '{stats_file}': {totalcount}")
        return
    print(f"Header '{header_name}' not found in '{stats_file}'.", file=sys.stderr)

def print_all_header_counts(stats_file):
    try:
        with open(stats_file, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: The file '{stats_file}' was not found.", file=sys.stderr)
        sys.exit(1)
    
    # Use defaultdict to automatically handle new headers
    headerswithcounts = defaultdict(int)
    
    # Aggregate counts for each header
    for item in data:
        if "name" in item and "count" in item:
            headerswithcounts[item["name"]] += item["count"]
    
    # Convert to list of tuples and sort
    sorted_headers = sorted(headerswithcounts.items(), key=lambda x: x[1], reverse=True)
    
    # Print headers with counts > 10
    for name, count in sorted_headers:
        if count > 10:
            print(f"{count:>8} {name}")

import csv
from datetime import datetime
# ...existing code...

def fullheaderanalysis(stats_file):
    try:
        with open(stats_file, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: The file '{stats_file}' was not found.", file=sys.stderr)
        sys.exit(1)
    
    # Use defaultdict to track header counts
    headerswithcounts = defaultdict(int)
    
    # First loop: Aggregate all header counts
    for item in data:
        if "name" in item and "count" in item:
            headerswithcounts[item["name"]] += item["count"]
    
    # Second loop: Add full header details
    for item in data:
        if "name" in item and "count" in item:
            header_key = f"{item['name']}: {item.get('value', '')}"
            headerswithcounts[header_key] = item['count']

    # Sort headers by count in descending order
    sorted_headers = sorted(headerswithcounts.items(), key=lambda x: x[1], reverse=True)

    # Generate timestamp for unique filename
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    csv_filename = f"header_analysis_{timestamp}.csv"

    # Write to CSV file
    with open(csv_filename, 'w', newline='', encoding='utf-8') as csvfile:
        csvwriter = csv.writer(csvfile)
        # Write header row
        csvwriter.writerow(['Counter', 'Header Name', 'Count'])
        # Write data rows
        counter = 0
        for name, count in sorted_headers:
            counter += 1
            if counter <= 100:
                csvwriter.writerow([counter, name, count])
            else:
                break

    # Print analysis with formatted output (original console output)
    print("Full Header Analysis:")
    print("-" * 120)
    print(f"{'Count':>10} {'Header Name':<100}")
    print("-" * 120)
    counter = 0
    for name, count in sorted_headers:
        counter += 1
        if counter <= 100:
            print(f"{counter}-- name: {name} count: {count}")
        else:
            break
    print("-" * 120)
    print(f"\nResults have been exported to: {csv_filename}")

    



if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Analyze header statistics.")
    parser.add_argument("stats_file", help="Path to the header-stats file.")
    args = parser.parse_args()
    # print_top_headers(args.stats_file)
    # print_header_counts(args.stats_file, "date")
    #print_all_header_counts(args.stats_file)
    fullheaderanalysis(args.stats_file)

