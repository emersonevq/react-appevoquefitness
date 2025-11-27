#!/usr/bin/env python3
"""
Script to add soft delete support to chamado table.
Adds is_deleted and data_delecao columns.
"""

from sqlalchemy import text, inspect
from core.db import engine

def add_soft_delete_columns():
    """Add is_deleted and data_delecao columns to chamado table"""
    
    with engine.connect() as conn:
        # Check if columns already exist
        inspector = inspect(engine)
        columns = {col['name'] for col in inspector.get_columns('chamado')}
        
        print(f"Current columns in chamado table: {columns}")
        
        # Add is_deleted column if it doesn't exist
        if 'is_deleted' not in columns:
            print("Adding is_deleted column...")
            conn.execute(text("""
                ALTER TABLE chamado 
                ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE
            """))
            print("✓ is_deleted column added successfully")
        else:
            print("✓ is_deleted column already exists")
        
        # Add data_delecao column if it doesn't exist
        if 'data_delecao' not in columns:
            print("Adding data_delecao column...")
            conn.execute(text("""
                ALTER TABLE chamado 
                ADD COLUMN data_delecao DATETIME NULL
            """))
            print("✓ data_delecao column added successfully")
        else:
            print("✓ data_delecao column already exists")
        
        # Create index on is_deleted for better query performance
        try:
            conn.execute(text("""
                CREATE INDEX idx_chamado_is_deleted ON chamado(is_deleted)
            """))
            print("✓ Index on is_deleted created successfully")
        except Exception as e:
            if "already exists" in str(e):
                print("✓ Index on is_deleted already exists")
            else:
                print(f"Note: Could not create index: {e}")
        
        conn.commit()
        print("\n✓ Soft delete migration completed successfully!")

if __name__ == "__main__":
    try:
        add_soft_delete_columns()
    except Exception as e:
        print(f"✗ Error during migration: {e}")
        import traceback
        traceback.print_exc()
