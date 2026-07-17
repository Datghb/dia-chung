$ErrorActionPreference = "Stop"
Push-Location "$PSScriptRoot\..\frontend"
npm install
Pop-Location
Push-Location "$PSScriptRoot\..\backend"
python -m pip install -e ".[dev]"
Pop-Location

