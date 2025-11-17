from __future__ import annotations
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from core.db import get_db
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/powerbi", tags=["Power BI"])

# Power BI Configuration
POWERBI_CLIENT_ID = os.getenv("POWERBI_CLIENT_ID", "7cc65d27-294f-47a4-a525-d5efb61871f5")
POWERBI_OBJECT_ID = os.getenv("POWERBI_OBJECT_ID", "ed04a53f-153b-4a99-8104-47e88c0a5476")
POWERBI_TENANT_ID = os.getenv("POWERBI_TENANT_ID", "9f45f492-87a3-4214-862d-4c0d080aa136")
POWERBI_DISPLAY_NAME = os.getenv("POWERBI_DISPLAY_NAME", "PORTAL BI")

AUTHORITY_URL = f"https://login.microsoftonline.com/{POWERBI_TENANT_ID}"
TOKEN_ENDPOINT = f"{AUTHORITY_URL}/oauth2/v2.0/token"
POWERBI_API_URL = "https://api.powerbi.com/v1.0/myorg"


async def get_service_principal_token() -> str:
    """Get access token using service principal credentials (Client Credentials Flow)"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                TOKEN_ENDPOINT,
                data={
                    "grant_type": "client_credentials",
                    "client_id": POWERBI_CLIENT_ID,
                    "scope": "https://analysis.windows.net/.default",
                },
            )
            
            if response.status_code != 200:
                print(f"Token error: {response.text}")
                raise HTTPException(status_code=401, detail="Failed to get Power BI token")
            
            token_data = response.json()
            return token_data.get("access_token")
    except httpx.RequestError as e:
        print(f"Request error: {e}")
        raise HTTPException(status_code=500, detail="Failed to connect to token service")
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Failed to authenticate with Power BI")


@router.get("/token")
async def get_powerbi_token(db: Session = Depends(get_db)):
    """Get Power BI access token for embedded authentication"""
    try:
        token = await get_service_principal_token()
        return {
            "access_token": token,
            "token_type": "Bearer",
            "display_name": POWERBI_DISPLAY_NAME,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_powerbi_token: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboards")
async def get_powerbi_dashboards(db: Session = Depends(get_db)):
    """Get list of Power BI dashboards"""
    try:
        token = await get_service_principal_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{POWERBI_API_URL}/dashboards",
                headers=headers,
            )
            
            if response.status_code != 200:
                print(f"Dashboards error: {response.text}")
                return {"value": []}
            
            return response.json()
    except Exception as e:
        print(f"Error fetching dashboards: {e}")
        return {"value": []}


@router.get("/reports")
async def get_powerbi_reports(db: Session = Depends(get_db)):
    """Get list of Power BI reports"""
    try:
        token = await get_service_principal_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{POWERBI_API_URL}/reports",
                headers=headers,
            )
            
            if response.status_code != 200:
                print(f"Reports error: {response.text}")
                return {"value": []}
            
            return response.json()
    except Exception as e:
        print(f"Error fetching reports: {e}")
        return {"value": []}


@router.get("/status")
async def check_powerbi_status(db: Session = Depends(get_db)):
    """Check Power BI connection status"""
    try:
        token = await get_service_principal_token()
        return {
            "status": "connected",
            "display_name": POWERBI_DISPLAY_NAME,
            "tenant_id": POWERBI_TENANT_ID,
        }
    except Exception as e:
        print(f"Error checking status: {e}")
        return {
            "status": "disconnected",
            "error": str(e),
        }
