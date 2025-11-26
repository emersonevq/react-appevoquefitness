from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from core.db import Base


class MetricsCacheDB(Base):
    """Cache persistente para métricas calculadas com TTL"""
    __tablename__ = "metrics_cache_db"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cache_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    cache_value: Mapped[dict] = mapped_column(JSON, nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    
    def is_expired(self) -> bool:
        """Verifica se o cache expirou"""
        return datetime.utcnow() > self.expires_at


class SLACalculationLog(Base):
    """Log de última execução de cada cálculo SLA para incrementalidade"""
    __tablename__ = "sla_calculation_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    calculation_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # '24h', 'mes', 'distribution'
    last_calculated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    last_calculated_chamado_id: Mapped[int | None] = mapped_column(Integer, nullable=True)  # Para rastrear progresso
    chamados_count: Mapped[int] = mapped_column(Integer, default=0)  # Quantidade de chamados processados
    execution_time_ms: Mapped[float] = mapped_column(Float, default=0)  # Tempo de execução em ms
