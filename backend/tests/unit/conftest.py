import sys
from pathlib import Path
# Add backend/ to path so 'legal_radar' is importable as 'legal_radar'
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
