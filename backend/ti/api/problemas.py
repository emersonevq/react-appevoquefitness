from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from core.db import get_db, engine
from ti.schemas.problema import ProblemaCreate, ProblemaOut

router = APIRouter(prefix="/problemas", tags=["TI - Problemas"])

@router.get("", response_model=list[ProblemaOut])
def listar_problemas(db: Session = Depends(get_db)):
    from ..models import Problema, Chamado
    try:
        try:
            Problema.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass

        result = []

        # 1) Try legacy table "problema_reportado" with various column name combinations
        legacy_queries = [
            # prioridade_padrao and requer_item_internet columns
            "SELECT id, nome, prioridade_padrao, requer_item_internet FROM problema_reportado WHERE ativo = 1",
            "SELECT id, nome, prioridade_padrao, requer_item_internet FROM problema_reportado WHERE ativo = 1 OR ativo IS NULL",
            "SELECT id, nome, prioridade_padrao, requer_item_internet FROM problema_reportado",
            # prioridade and requer_internet columns
            "SELECT id, nome, prioridade, requer_internet FROM problema_reportado WHERE ativo = 1",
            "SELECT id, nome, prioridade, requer_internet FROM problema_reportado WHERE ativo = 1 OR ativo IS NULL",
            "SELECT id, nome, prioridade, requer_internet FROM problema_reportado",
            # Try with DEFAULT priority if those columns don't exist
            "SELECT id, nome, 'Normal' as prioridade, 0 as requer_internet FROM problema_reportado WHERE ativo = 1",
            "SELECT id, nome, 'Normal' as prioridade, 0 as requer_internet FROM problema_reportado",
            # problemas_reportados table (plural)
            "SELECT id, nome, prioridade_padrao, requer_item_internet FROM problemas_reportados WHERE ativo = 1",
            "SELECT id, nome, prioridade_padrao, requer_item_internet FROM problemas_reportados WHERE ativo = 1 OR ativo IS NULL",
            "SELECT id, nome, prioridade_padrao, requer_item_internet FROM problemas_reportados",
            "SELECT id, nome, prioridade, requer_internet FROM problemas_reportados WHERE ativo = 1",
            "SELECT id, nome, prioridade, requer_internet FROM problemas_reportados WHERE ativo = 1 OR ativo IS NULL",
            "SELECT id, nome, prioridade, requer_internet FROM problemas_reportados",
        ]

        for sql in legacy_queries:
            try:
                res = db.execute(text(sql))
                fetched = res.fetchall()
                if fetched:
                    return [
                        {
                            "id": int(r[0]) if r[0] is not None else 0,
                            "nome": str(r[1]),
                            "prioridade": str(r[2] or "Normal"),
                            "requer_internet": bool(r[3]) if len(r) > 3 else False,
                        }
                        for r in fetched
                    ]
            except Exception as e:
                continue

        # 2) Try ORM standard "problema" table
        try:
            rows = db.query(Problema).order_by(Problema.nome.asc()).all()
            if rows:
                return [
                    {
                        "id": r.id,
                        "nome": r.nome,
                        "prioridade": r.prioridade,
                        "requer_internet": bool(r.requer_internet),
                    }
                    for r in rows
                ]
        except Exception:
            pass

        # 3) Try "problemas" table (plural) with various column combinations
        fallback_queries = [
            "SELECT id, nome, prioridade, requer_internet FROM problemas",
            "SELECT id, nome, prioridade_padrao, requer_item_internet FROM problemas",
            "SELECT id, problema AS nome, prioridade, requer_internet FROM problemas",
            "SELECT id, problema AS nome, prioridade_padrao, requer_item_internet FROM problemas",
            "SELECT id, nome, 'Normal' as prioridade, 0 as requer_internet FROM problemas",
            "SELECT id, problema AS nome, 'Normal' as prioridade, 0 as requer_internet FROM problemas",
        ]

        for sql in fallback_queries:
            try:
                res = db.execute(text(sql))
                fetched = res.fetchall()
                if fetched:
                    return [
                        {
                            "id": int(r[0]) if r[0] is not None else 0,
                            "nome": str(r[1]),
                            "prioridade": str(r[2] or "Normal"),
                            "requer_internet": bool(r[3]) if len(r) > 3 else False,
                        }
                        for r in fetched
                    ]
            except Exception:
                continue

        # 4) Fallback: extract problems from existing chamados (tickets)
        try:
            existing_names = {r[0] for r in db.query(Chamado.problema).distinct().all() if r[0]}
            names_in_table = {r["nome"].lower() for r in result}
            for nome in sorted(n for n in (x.lower() for x in existing_names) if n not in names_in_table):
                result.append(
                    {
                        "id": 0,
                        "nome": nome,
                        "prioridade": "Normal",
                        "requer_internet": nome.lower() == "internet",
                    }
                )
            if result:
                return result
        except Exception:
            pass

        # If all else fails, return empty list
        return []

    except Exception as e:
        print(f"Error in listar_problemas: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao listar problemas: {e}")

@router.post("", response_model=ProblemaOut)
def criar_problema(payload: ProblemaCreate, db: Session = Depends(get_db)):
    try:
        from ..models import Problema
        Problema.__table__.create(bind=engine, checkfirst=True)
        from ti.services.problemas import criar_problema as service_criar
        return service_criar(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar problema: {e}")
