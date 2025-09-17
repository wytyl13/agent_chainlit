from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from datetime import datetime
from pathlib import Path
import argparse
from dotenv import load_dotenv, dotenv_values
import os

# 导入各个服务类
from agent.llm_api.ollama_llm import OllamaLLM
from agent.config.llm_config import LLMConfig
from api.server.community_real_time_data_server import CommunityRealTimeDataServer
from api.server.user_data_server import UserDataServer
from api.server.function_call_server import FunctionCallServer
from agent.tool.enhance_retrieval import EnhanceRetrieval
from api.server.file_server import FileServer
from api.server.menu_server import MenuDataServer
from api.server.order_food_server import OrderFoodServer

ROOT_DIRECTORY = Path(__file__).parent.parent.parent
SQL_CONFIG_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / "sql_config.yaml")
OLLAMA_QWEN_CONFIG = str(ROOT_DIRECTORY / "config" / "yaml" / "ollama_config.yaml")



environment = dotenv_values(str(ROOT_DIRECTORY / ".env"))
print(environment)
QWEN_OLLAMA_CONFIG_PATH = environment["LLM_CONFIG_PATH"] if "LLM_CONFIG_PATH" in environment else None
RETRIEVAL_DATA_PATH = environment["RETRIEVAL_DATA_PATH"] if "RETRIEVAL_DATA_PATH" in environment else None
RETRIEVAL_STORAGE_PATH = environment["RETRIEVAL_STORAGE_PATH"] if "RETRIEVAL_STORAGE_PATH" in environment else None
MODEL_PATH = environment["MODEL_PATH"] if "MODEL_PATH" in environment else None

QWEN_OLLAMA_CONFIG_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / "ollama_config.yaml") if not os.path.exists(QWEN_OLLAMA_CONFIG_PATH) else QWEN_OLLAMA_CONFIG_PATH
DEFAULT_RETRIEVAL_DATA_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / RETRIEVAL_DATA_PATH) if not os.path.exists(RETRIEVAL_DATA_PATH) else RETRIEVAL_DATA_PATH
DEFAULT_RETRIEVAL_STORAGE_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / RETRIEVAL_STORAGE_PATH) if not os.path.exists(RETRIEVAL_STORAGE_PATH) else RETRIEVAL_STORAGE_PATH
DEFAULT_MODEL_PATH = str(ROOT_DIRECTORY / MODEL_PATH) if not os.path.exists(MODEL_PATH) else MODEL_PATH

class AeroSenseMainServer:
    """主服务器类，统一管理所有服务"""
    
    def __init__(self, sql_config_path: str = SQL_CONFIG_PATH):
        self.sql_config_path = sql_config_path
        self.app = FastAPI(title="AeroSense综合API服务", version="1.0.0")
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # 初始化各个服务
        self.community_service = CommunityRealTimeDataServer(self.sql_config_path)
        self.user_service = UserDataServer(self.sql_config_path)
        self.ollama_qwen_llm = OllamaLLM(config=LLMConfig.from_file(Path(OLLAMA_QWEN_CONFIG)))
        self.enhance_qwen_admin = EnhanceRetrieval(
            llm=self.ollama_qwen_llm, 
            retrieval_flag=False, 
            data_dir=DEFAULT_RETRIEVAL_DATA_PATH, 
            index_dir=DEFAULT_RETRIEVAL_STORAGE_PATH,
            embedding_model_path="/work/ai/agent/models"
        )
        self.function_call_server = FunctionCallServer(
            enhance_retrieval=self.enhance_qwen_admin
        )
        self.file_service = FileServer(str(ROOT_DIRECTORY / "api" / "source"))
        self.menu_service = MenuDataServer(self.sql_config_path)
        self.order_food_service = OrderFoodServer(self.sql_config_path)
        # 设置应用
        self._setup_middleware()
        self._setup_base_routes()
        self._register_all_services()
    
    def _setup_middleware(self):
        """设置中间件"""
        self.app.add_middleware(
            CORSMiddleware,
            # allow_origins=[
            #     "https://localhost:8000",
            #     "https://localhost:8002",
            #     "https://localhost:8890",  
            #     "https://127.0.0.1:8000", 
            #     "https://127.0.0.1:8002",
            #     "https://127.0.0.1:8890",
            #     "https://1.71.15.121:8000",
            #     "https://1.71.15.121:8002",
            #     "https://1.71.15.121:8890",
            #     "https://ai.shunxikj.com:8000", 
            #     "https://ai.shunxikj.com:8002",
            #     "https://ai.shunxikj.com:8890", 
            # ],
            allow_origins=["*"],
            allow_methods=["*"],
            allow_credentials=True,
            # allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["*"],
        )
        
        @self.app.middleware("http")
        async def log_requests(request, call_next):
            self.logger.info(f"[收到请求] {request.method} {request.url}")
            response = await call_next(request)
            self.logger.info(f"[响应状态] {response.status_code}")
            return response
    
    
    def _setup_base_routes(self):
        """设置基础路由"""
        @self.app.get("/")
        async def root():
            return {"message": "AeroSense综合API服务", "version": "1.0.0"}
        
        @self.app.get("/api/health")
        async def health_check():
            return {
                "status": "ok", 
                "message": "API服务运行正常", 
                "timestamp": datetime.now().isoformat(),
                "services": ["device", "community", "user", "sleep"]
            }
    
    
    def _register_all_services(self):
        """注册所有服务的路由"""
        
        # 注册社区服务路由
        self.community_service.register_routes(self.app)
        
        # 注册用户服务路由
        self.user_service.register_routes(self.app)
        
        # 注册工具调用服务路由
        self.function_call_server.register_routes(self.app)

        # 注意文件服务路由
        self.file_service.register_routes(self.app)

        # 注册菜单服务
        self.menu_service.register_routes(self.app)

        # 注册菜品订单服务
        self.order_food_service.register_routes(self.app)

    def run(
        self, 
        host: str = "0.0.0.0", 
        port: int = 8890,
        ssl_certfile: str = None,
        ssl_keyfile: str = None
    ):
        """启动服务器"""
        print("🚀 启动AeroSense综合API服务...")
        print(f"📡 服务地址: https://{host}:{port}")
        print(f"📋 API文档: https://{host}:{port}/docs")
        print("📋 服务列表:")
        print("   - 设备管理服务 (Device Service)")
        print("   - 社区服务 (Community Service)")
        print("   - 用户服务 (User Service)")
        print("   - 睡眠统计服务 (Sleep Service)")
        
        if ssl_certfile and ssl_keyfile:
            print(f"🔒 使用SSL证书: {ssl_certfile}")
            print(f"🔑 使用SSL密钥: {ssl_keyfile}")
        
        # 构建uvicorn运行参数
        run_kwargs = {
            "app": self.app,
            "host": host,
            "port": port,
            "log_level": "info",
            "reload": False,
        }
        
        # 如果提供了SSL证书，则添加SSL配置
        if ssl_certfile and ssl_keyfile:
            run_kwargs.update({
                "ssl_certfile": ssl_certfile,
                "ssl_keyfile": ssl_keyfile
            })
        
        uvicorn.run(**run_kwargs)


def parse_arguments():
    """解析命令行参数"""
    parser = argparse.ArgumentParser(
        description="AeroSense综合API服务器",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python main.py                    # 使用默认端口 8890
  python main.py --port 8080       # 指定端口为 8080
  python main.py -p 9000           # 指定端口为 9000 (简写)
  python main.py --host 127.0.0.1  # 指定主机地址
        """
    )
    
    parser.add_argument(
        "--port", "-p",
        type=int,
        default=8890,
        help="服务器端口号 (默认: 8890)"
    )
    
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_arguments()
    # 证书文件路径
    cert_file = str(ROOT_DIRECTORY / "cert" / "shunxikj.com.crt")
    key_file = str(ROOT_DIRECTORY / "cert" / "shunxikj.com.key")
    
    server = AeroSenseMainServer()
    server.run(
        host="0.0.0.0",
        port=args.port,
        ssl_certfile=cert_file,
        ssl_keyfile=key_file
    )