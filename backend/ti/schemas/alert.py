from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel
from typing import List

class AlertOut(BaseModel):
    id: int
    title: str
    message: str | None = None
    description: str | None = None
    severity: str = "low"
    pages: List[str] | None = None
    show_on_home: bool = False
    created_by: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    ativo: bool = True
    imagem_blob: str | None = None
    imagem_mime_type: str | None = None
    viewed: bool = False

    class Config:
        from_attributes = True

class AlertCreate(BaseModel):
    title: str
    message: str | None = None
    description: str | None = None
    severity: str = "low"
    pages: List[str] | None = None
    show_on_home: bool = False

class AlertUpdate(BaseModel):
    title: str | None = None
    message: str | None = None
    description: str | None = None
    severity: str | None = None
    pages: List[str] | None = None
    show_on_home: bool | None = None
    ativo: bool | None = None
