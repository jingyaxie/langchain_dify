#!/usr/bin/env python3
"""
Database initialization script
"""
import os
import sys

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import init_db, engine
from app.models import token_usage  # Import to register models

def main():
    """Initialize the database"""
    print("Creating database tables...")
    try:
        init_db()
        print("✓ Database tables created successfully!")
    except Exception as e:
        print(f"✗ Error creating database tables: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 