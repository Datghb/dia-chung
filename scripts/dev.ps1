$ErrorActionPreference = "Stop"
Write-Host "Run backend: cd backend; uvicorn legal_radar.api.main:app --reload"
Write-Host "Run frontend: cd frontend; npm run dev"

