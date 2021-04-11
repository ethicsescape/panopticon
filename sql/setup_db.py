import sqlite3
import pandas as pd

conn = sqlite3.connect("panopticon.db")
cur = conn.cursor()

tables = [
    "game",
    "player",
    "decision",
    "clue",
    "vote",
    "hint"
]

with open("sql/create_tables.sql", "r") as create_script:
    cur.executescript(create_script.read())

for table in tables:
    print(f"Loading table {table}...")
    pd.read_csv(f"csv/{table}.csv").to_sql(table, conn, if_exists="replace", index=False)

print(f"Loaded {len(tables)} tables.")
