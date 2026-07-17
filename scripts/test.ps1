$ErrorActionPreference = "Stop"
Push-Location "$PSScriptRoot\..\frontend"
npm test
Pop-Location
Push-Location "$PSScriptRoot\..\backend"
python -m pytest
Pop-Location

