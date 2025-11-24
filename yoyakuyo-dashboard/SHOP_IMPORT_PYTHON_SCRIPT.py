#!/usr/bin/env python3
"""
Shop Import Script - Converts JSON/CSV to SQL INSERT statements
Usage: python shop_import_script.py input.json output.sql
"""

import json
import csv
import sys
import uuid
from typing import List, Dict, Any

def generate_uuid() -> str:
    """Generate a UUID v4"""
    return str(uuid.uuid4())

def sanitize_sql_string(value: Any) -> str:
    """Escape SQL strings properly"""
    if value is None:
        return 'NULL'
    if isinstance(value, (int, float)):
        return str(value)
    # Escape single quotes by doubling them
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"

def load_json_data(filepath: str) -> List[Dict[str, Any]]:
    """Load shop data from JSON file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_csv_data(filepath: str) -> List[Dict[str, Any]]:
    """Load shop data from CSV file"""
    shops = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            shops.append(row)
    return shops

def map_category_name(shop: Dict[str, Any]) -> str:
    """Map shop data to category name based on name/type"""
    name = (shop.get('name', '') or '').lower()
    category = (shop.get('category', '') or '').lower()
    shop_type = (shop.get('type', '') or '').lower()
    
    # Check for category keywords
    if any(kw in name or kw in category or kw in shop_type for kw in ['nail', 'manicure', 'pedicure']):
        return 'Nail Salon'
    elif any(kw in name or kw in category or kw in shop_type for kw in ['barber', 'barbershop']):
        return 'Barbershop'
    elif any(kw in name or kw in category or kw in shop_type for kw in ['hair', 'salon', 'haircut']):
        return 'Hair Salon'
    elif any(kw in name or kw in category or kw in shop_type for kw in ['spa', 'massage', 'therapy']):
        return 'Spa & Massage'
    elif any(kw in name or kw in category or kw in shop_type for kw in ['eyelash', 'lash', 'extension']):
        return 'Eyelash'
    elif any(kw in name or kw in category or kw in shop_type for kw in ['beauty', 'cosmetic', 'makeup']):
        return 'Beauty Salon'
    else:
        return 'General Salon'

def generate_sql_inserts(shops: List[Dict[str, Any]]) -> str:
    """Generate SQL INSERT statements for shops"""
    sql_lines = [
        "-- ============================================================================",
        "-- AUTO-GENERATED SHOP IMPORT SQL",
        "-- ============================================================================",
        "-- Generated from shop data import",
        "-- Total shops: " + str(len(shops)),
        "-- ============================================================================\n",
        "CREATE TEMPORARY TABLE temp_shop_import (",
        "    name VARCHAR(255) NOT NULL,",
        "    address VARCHAR(255),",
        "    city VARCHAR(255),",
        "    country VARCHAR(255) DEFAULT 'Japan',",
        "    zip_code VARCHAR(20),",
        "    phone VARCHAR(20),",
        "    email VARCHAR(255),",
        "    website VARCHAR(500),",
        "    latitude NUMERIC(10, 8),",
        "    longitude NUMERIC(11, 8),",
        "    category_name VARCHAR(255),",
        "    osm_id TEXT,",
        "    google_place_id VARCHAR(255),",
        "    description TEXT,",
        "    language_code VARCHAR(10) DEFAULT 'ja'",
        ");\n",
        "INSERT INTO temp_shop_import (name, address, city, country, zip_code, phone, email, website, latitude, longitude, category_name, osm_id, google_place_id, description) VALUES"
    ]
    
    values = []
    for shop in shops:
        # Extract fields with defaults
        name = shop.get('name', shop.get('Name', '')) or ''
        address = shop.get('address', shop.get('Address', shop.get('address_1', ''))) or None
        city = shop.get('city', shop.get('City', shop.get('address_2', ''))) or None
        country = shop.get('country', shop.get('Country', 'Japan')) or 'Japan'
        zip_code = shop.get('zip_code', shop.get('zip', shop.get('postal_code', ''))) or None
        phone = shop.get('phone', shop.get('Phone', shop.get('telephone', ''))) or None
        email = shop.get('email', shop.get('Email', '')) or None
        website = shop.get('website', shop.get('Website', shop.get('url', ''))) or None
        lat = shop.get('latitude', shop.get('Latitude', shop.get('lat', '')))
        lng = shop.get('longitude', shop.get('Longitude', shop.get('lng', shop.get('lon', ''))))
        category_name = shop.get('category_name', shop.get('Category', '')) or map_category_name(shop)
        osm_id = shop.get('osm_id', shop.get('OSM_ID', '')) or None
        google_place_id = shop.get('google_place_id', shop.get('Google_Place_ID', '')) or None
        description = shop.get('description', shop.get('Description', '')) or None
        
        # Convert lat/lng to numeric
        try:
            latitude = float(lat) if lat else None
        except (ValueError, TypeError):
            latitude = None
        
        try:
            longitude = float(lng) if lng else None
        except (ValueError, TypeError):
            longitude = None
        
        # Skip if no name
        if not name:
            continue
        
        # Build VALUES tuple
        value_tuple = (
            sanitize_sql_string(name),
            sanitize_sql_string(address),
            sanitize_sql_string(city),
            sanitize_sql_string(country),
            sanitize_sql_string(zip_code),
            sanitize_sql_string(phone),
            sanitize_sql_string(email),
            sanitize_sql_string(website),
            str(latitude) if latitude is not None else 'NULL',
            str(longitude) if longitude is not None else 'NULL',
            sanitize_sql_string(category_name),
            sanitize_sql_string(osm_id),
            sanitize_sql_string(google_place_id),
            sanitize_sql_string(description)
        )
        
        values.append(f"    ({', '.join(value_tuple)})")
    
    sql_lines.append(',\n'.join(values) + ';')
    
    # Add the rest of the migration script
    sql_lines.extend([
        "\n-- Continue with steps 3-8 from IMPORT_SHOPS_MIGRATION.sql",
        "-- (Ensure categories, remove duplicates, insert new shops, etc.)"
    ])
    
    return '\n'.join(sql_lines)

def main():
    if len(sys.argv) < 3:
        print("Usage: python shop_import_script.py <input.json|csv> <output.sql>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    # Load data
    if input_file.endswith('.json'):
        shops = load_json_data(input_file)
    elif input_file.endswith('.csv'):
        shops = load_csv_data(input_file)
    else:
        print("Error: Input file must be .json or .csv")
        sys.exit(1)
    
    print(f"Loaded {len(shops)} shops from {input_file}")
    
    # Generate SQL
    sql = generate_sql_inserts(shops)
    
    # Write output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql)
    
    print(f"Generated SQL file: {output_file}")
    print(f"Total shops: {len(shops)}")

if __name__ == '__main__':
    main()

