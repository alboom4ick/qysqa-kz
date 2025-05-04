import uvicorn
from uvicorn.config import Config

if __name__ == "__main__":
    config = Config(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        timeout_keep_alive=300,        # Увеличиваем таймаут keep-alive до 300 секунд
        timeout_graceful_shutdown=330, # Увеличиваем таймаут graceful shutdown до 120 секунд
        h11_max_incomplete_event_size=65536,  # Увеличиваем максимальный размер буфера для HTTP событий
        ws_ping_interval=300.0,         # Увеличиваем интервал пинга WebSocket до 30 секунд
        ws_ping_timeout=300.0,          # Увеличиваем таймаут пинга WebSocket до 30 секунд
    )
    server = uvicorn.Server(config)
    server.run() 