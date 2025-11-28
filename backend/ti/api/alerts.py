from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from io import BytesIO
from datetime import datetime
import base64
from core.db import get_db, engine
from ..models.alert import Alert
from ..schemas.alert import AlertOut, AlertCreate

router = APIRouter(prefix="/alerts", tags=["TI - Alerts"]) 

@router.get("", response_model=List[AlertOut])
def list_alerts(db: Session = Depends(get_db)):
    try:
        # Criar tabela se não existir
        try:
            Alert.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass
        
        # Buscar todos os alertas (removido filtro de 'ativo' pois não existe)
        alerts = db.query(Alert).order_by(Alert.created_at.desc()).all()
        
        # Converter blob para base64 para enviar ao frontend
        result = []
        for alert in alerts:
            alert_dict = {
                "id": alert.id,
                "title": alert.title,
                "message": alert.message,
                "description": alert.description,
                "severity": alert.severity,
                "created_at": alert.created_at,
                "updated_at": alert.updated_at,
                "imagem_mime_type": alert.imagem_mime_type,
                "imagem_blob": None
            }
            
            # Converter blob para base64 se existir
            if alert.imagem_blob:
                alert_dict["imagem_blob"] = base64.b64encode(alert.imagem_blob).decode('utf-8')
            
            result.append(alert_dict)
        
        return result
        
    except Exception as e:
        print(f"[ALERTS] Erro ao listar alertas: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao listar alertas: {e}")


@router.post("")
async def create_alert(
    title: str = Form(...),
    message: str = Form(...),
    description: Optional[str] = Form(None),
    severity: str = Form("low"),
    imagem: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        print(f"[ALERTS] Criando alerta: title={title}, severity={severity}")

        # Validar severity
        valid_severities = ["low", "medium", "high", "critical"]
        if severity not in valid_severities:
            print(f"[ALERTS] Severity inválido: {severity}, usando 'low'")
            severity = "low"

        # Processar imagem
        imagem_blob = None
        imagem_mime_type = None

        if imagem:
            try:
                imagem_blob = await imagem.read()
                imagem_mime_type = imagem.content_type
                print(f"[ALERTS] Imagem recebida: {imagem.filename}, tamanho={len(imagem_blob)} bytes, mime={imagem_mime_type}")
            except Exception as e:
                print(f"[ALERTS] Erro ao processar imagem: {e}")
                # Continua sem imagem se der erro

        # Criar alerta (usando apenas campos que existem no banco)
        new_alert = Alert(
            title=title,
            message=message,
            description=description,
            severity=severity,
            imagem_blob=imagem_blob,
            imagem_mime_type=imagem_mime_type
        )
        
        print(f"[ALERTS] Objeto Alert criado")
        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)
        print(f"[ALERTS] Alerta salvo com ID: {new_alert.id}")
        
        # Retornar resposta
        return {
            "id": new_alert.id,
            "title": new_alert.title,
            "message": new_alert.message,
            "description": new_alert.description,
            "severity": new_alert.severity,
            "created_at": new_alert.created_at,
            "updated_at": new_alert.updated_at,
            "imagem_mime_type": new_alert.imagem_mime_type,
            "imagem_blob": base64.b64encode(new_alert.imagem_blob).decode('utf-8') if new_alert.imagem_blob else None
        }
        
    except Exception as e:
        db.rollback()
        print(f"[ALERTS] ERRO ao criar alerta: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao criar alerta: {str(e)}")


@router.get("/{alert_id}/imagem")
def get_alert_image(alert_id: int, db: Session = Depends(get_db)):
    try:
        alert = db.query(Alert).filter(Alert.id == int(alert_id)).first()
        if not alert or not alert.imagem_blob:
            raise HTTPException(status_code=404, detail="Imagem não encontrada")

        mime_type = alert.imagem_mime_type or "image/jpeg"
        return StreamingResponse(
            BytesIO(alert.imagem_blob),
            media_type=mime_type,
            headers={"Content-Disposition": f"inline; filename=alerta_{alert_id}.jpg"}
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ALERTS] Erro ao baixar imagem: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao baixar imagem: {e}")


@router.delete("/{alert_id}")
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    try:
        alert = db.query(Alert).filter(Alert.id == int(alert_id)).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alerta não encontrado")
        
        # Deletar permanentemente (já que não temos campo 'ativo')
        db.delete(alert)
        db.commit()
        
        return {"ok": True}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[ALERTS] Erro ao remover alerta: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao remover alerta: {e}")