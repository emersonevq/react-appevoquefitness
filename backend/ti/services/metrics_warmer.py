"""
Cache Warmer para Métricas SLA

Pré-calcula e armazena métricas em cache quando o servidor inicia,
evitando a primeira requisição lenta.

Executa:
1. Na inicialização do servidor
2. A cada 9 minutos (antes do TTL de 10 min expirar)
"""

import threading
import time
from datetime import datetime
from sqlalchemy.orm import Session
from core.db import SessionLocal
from ti.services.metrics import MetricsCalculator
import logging

logger = logging.getLogger(__name__)


class MetricsWarmer:
    """Aquecedor de cache para métricas SLA"""
    
    _thread: threading.Thread | None = None
    _stop_event = threading.Event()
    _is_running = False

    @staticmethod
    def warm_all_metrics(db: Session):
        """Pré-calcula todas as métricas e armazena em cache"""
        try:
            start = time.time()
            logger.info("🔥 Iniciando aquecimento de cache de métricas...")

            # Calcula todas as métricas (irão ser armazenadas em cache)
            sla_24h = MetricsCalculator.get_sla_compliance_24h(db)
            sla_mes = MetricsCalculator.get_sla_compliance_mes(db)
            sla_dist = MetricsCalculator.get_sla_distribution(db)
            tempo_resp_24h = MetricsCalculator.get_tempo_medio_resposta_24h(db)
            tempo_resp_mes, total_mes = MetricsCalculator.get_tempo_medio_resposta_mes(db)
            perf = MetricsCalculator.get_performance_metrics(db)

            elapsed = time.time() - start
            logger.info(f"✅ Cache aquecido em {elapsed:.2f}s")
            logger.info(f"   SLA 24h: {sla_24h}%")
            logger.info(f"   SLA Mês: {sla_mes}%")
            logger.info(f"   Distribuição: {sla_dist['dentro_sla']}/{sla_dist['fora_sla']}")
            logger.info(f"   Tempo resposta 24h: {tempo_resp_24h}")
            logger.info(f"   Tempo resposta mês: {tempo_resp_mes} ({total_mes} chamados)")
            logger.info(f"   Performance: Resolução={perf['tempo_resolucao_medio']}, Resposta={perf['primeira_resposta_media']}")

        except Exception as e:
            logger.error(f"❌ Erro ao aquecer cache: {e}")
            import traceback
            traceback.print_exc()

    @staticmethod
    def _warmer_loop():
        """Loop de aquecimento de cache (executa a cada 9 minutos)"""
        logger.info("🔥 Iniciando thread de aquecimento automático de cache...")
        
        while not MetricsWarmer._stop_event.is_set():
            try:
                db = SessionLocal()
                MetricsWarmer.warm_all_metrics(db)
                db.close()
                
                # Aguarda 9 minutos antes de aquecer novamente (TTL é 10 min)
                # Isso garante que o cache nunca expire completamente
                logger.info("⏰ Próximo aquecimento de cache em 9 minutos...")
                MetricsWarmer._stop_event.wait(9 * 60)
                
            except Exception as e:
                logger.error(f"❌ Erro no loop de aquecimento: {e}")
                MetricsWarmer._stop_event.wait(30)  # Retry em 30s se houver erro

    @staticmethod
    def start():
        """Inicia o aquecedor de cache em background"""
        if MetricsWarmer._is_running:
            return
        
        MetricsWarmer._is_running = True
        MetricsWarmer._stop_event.clear()
        
        # Aquecimento inicial (síncrone)
        try:
            db = SessionLocal()
            MetricsWarmer.warm_all_metrics(db)
            db.close()
        except Exception as e:
            logger.error(f"❌ Erro no aquecimento inicial: {e}")
        
        # Thread de aquecimento periódico (assincrone)
        MetricsWarmer._thread = threading.Thread(
            target=MetricsWarmer._warmer_loop,
            daemon=True,
            name="MetricsWarmerThread"
        )
        MetricsWarmer._thread.start()
        logger.info("✅ Aquecedor de cache iniciado!")

    @staticmethod
    def stop():
        """Para o aquecedor de cache"""
        if not MetricsWarmer._is_running:
            return
        
        MetricsWarmer._is_running = False
        MetricsWarmer._stop_event.set()
        
        if MetricsWarmer._thread:
            MetricsWarmer._thread.join(timeout=5)
        
        logger.info("🛑 Aquecedor de cache parado!")
