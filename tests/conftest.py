"""pytest path setup: deixa os módulos de scripts/ importáveis pelos testes."""
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
