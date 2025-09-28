#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/02 15:10
@Author  : weiyutao
@File    : function_call_server.py
"""

#!/usr/bin/env python3
"""
function_call_server: 工具调用服务
"""

from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from pathlib import Path
import hashlib
import json
import time
import os
import requests
import tempfile
import urllib.parse
from urllib.parse import urlparse
import mimetypes
import logging
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
import io



from pydantic import BaseModel

from agent.llm_api.ollama_llm import OllamaLLM
from agent.tool.retrieval import Retrieval
from agent.tool.enhance_retrieval import EnhanceRetrieval
from dotenv import load_dotenv, dotenv_values
import argparse
import base64

from agent.llm_api.ollama_llm import OllamaLLM
from agent.config.llm_config import LLMConfig
from tools.order import Order
from tools.client_service import ClientService
from tools.role import Role
from agent.tool.function_call import FunctionCall
from tools.food_service import FoodService
from tools.government_grant import GovernmentGrant
from tools.procurement_project import ProcurementProject
from tools.user_server.menu_data_server import MenuService
from agent.tool.planning_agent_community_ai_user import PlanningAgentCommunityAiUser
from tools.user_server.order_food_tool import OrderFoodTool
from tools.user_server.list_menu_tool import ListMenu
from tools.user_server.test_server import Test
from tools.user_server.health_report import HealthReport
from tools.user_server.product_order import ProductOrder
from tools.user_server.weixiu import WeiXiu
from tools.user_server.graph_server import GraphServer
from tools.user_server.merchant_management_tool import MerchantManagementService
from tools.real_time_vital_analyze.real_time_vital_analyze_tool import RealTimeVitalAnalyze
from tools.real_time_vital_analyze.welcome import WelcomeTool
from tools.real_time_vital_analyze.health_report_tool import HealthReportTool



ROOT_DIRECTORY = Path(__file__).parent.parent.parent.parent
SQL_CONFIG_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / "sql_config.yaml")
OLLAMA_QWEN_CONFIG = str(ROOT_DIRECTORY / "config" / "yaml" / "ollama_config.yaml")
TRADITIONAL_MEDICAL_OLLAMA_CONFIG = str(ROOT_DIRECTORY / "config" / "yaml" / "shizhen_ollama_config.yaml")

environment = dotenv_values(str(ROOT_DIRECTORY / ".env"))
print(environment)
QWEN_OLLAMA_CONFIG_PATH = environment["LLM_CONFIG_PATH"] if "LLM_CONFIG_PATH" in environment else None
RETRIEVAL_DATA_PATH = environment["RETRIEVAL_DATA_PATH"] if "RETRIEVAL_DATA_PATH" in environment else None
RETRIEVAL_STORAGE_PATH = environment["RETRIEVAL_STORAGE_PATH"] if "RETRIEVAL_STORAGE_PATH" in environment else None
MODEL_PATH = environment["MODEL_PATH"] if "MODEL_PATH" in environment else None

ollama_shizhen = OllamaLLM(config=LLMConfig.from_file(Path(TRADITIONAL_MEDICAL_OLLAMA_CONFIG)))



REACT_FLAG = 0


# 1. welcome system
welcome_tool_service = WelcomeTool()
welcome_system = [welcome_tool_service]

# 2. meal_assistance_subsystem
menu_service = MenuService()
meal_assistance_subsystem = [menu_service]


# 3. meal_assistance_service_app
order_food_tool = OrderFoodTool()
list_menu_tool = ListMenu()
meal_assistance_service_app = [order_food_tool, list_menu_tool]


# 4. real_time_vital_analyze_service
real_time_vital_analyze = RealTimeVitalAnalyze()
health_report_tool = HealthReportTool()
real_time_vital_analyze_service = [real_time_vital_analyze, health_report_tool]


# 5. merchant_service_system
merchant_management = MerchantManagementService()
merchant_service_system = [merchant_management]




class FunctionCallServerRequest(BaseModel):
    question: str = None
    messages: Optional[Union[str, List[Dict[str, Any]]]] = None
    service_name: Optional[str] = None
    stream: Optional[bool] = True
    is_ensure: Optional[int] = 0


service_config_list = [
    {
        "service_id": "welcome_system",
        "service_name": "欢迎",
        "emoji": "🍽️",
        "action": "switch_to_welcome_system",
        "identifier": "welcome_system",
        "tools": welcome_system
    },
    {
        "service_id": "meal_assistance_subsystem",
        "service_name": "助餐服务子系统",
        "emoji": "🏠",
        "action": "switch_to_meal_subsystem",
        "identifier": "meal_assistance_subsystem",
        "tools": meal_assistance_subsystem
    },
    {
        "service_id": "meal_assistance_service_app",
        "service_name": "助餐服务应用",
        "emoji": "🍽️",
        "action": "switch_to_meal_service_app",
        "identifier": "meal_assistance_service_app",
        "tools": meal_assistance_service_app
    },
    {
        "service_id": "real_time_vital_analyze_service",
        "service_name": "实时生命体征监测系统",
        "emoji": "🍽️",
        "action": "switch_to_real_time_vital_analyze_service",
        "identifier": "real_time_vital_analyze_service",
        "tools": real_time_vital_analyze_service
    },
    {
        "service_id": "merchant_service_system",
        "service_name": "商家服务系统",
        "emoji": "🍽️",
        "action": "switch_to_merchant_service_system",
        "identifier": "merchant_service_system",
        "tools": merchant_service_system
    },
    {
        "service_id": "traditional_medical_service",
        "service_name": "中医问诊",
        "emoji": "🍽️",
        "action": "switch_to_traditional_medical_service",
        "identifier": "traditional_medical_service",
        "tools": merchant_service_system
    }
]

service_config = {item['service_id']: {'service_name': item['service_name'], 'emoji': item['emoji'], 'action': item['action'], 'identifier': f":{item['identifier']}", 'tools': item['tools']} for item in service_config_list}


class FunctionCallServer:
    """OnlyOffice文档编辑器类"""

    def __init__(
        self, 
        enhance_retrieval: EnhanceRetrieval = None
    ):
        self.enhance_retrieval = enhance_retrieval
        
        if self.enhance_retrieval is None:
            raise ValueError("llm must not be none!")


        self.function_call_start = FunctionCall(
            tools = welcome_system,
            enhance_llm=self.enhance_retrieval,
        )
        from agent.config.llm_config import LLMConfig
        QWEN_OLLAMA_CONFIG_PATH = "/work/ai/agent_chainlit/config/yaml/ollama_config.yaml"
        llm_qwen = OllamaLLM(config=LLMConfig.from_file(Path(QWEN_OLLAMA_CONFIG_PATH)))
        DEFAULT_RETRIEVAL_DATA_PATH = "/work/ai/agent_chainlit/retrieval_data"
        DEFAULT_RETRIEVAL_STORAGE_PATH = "/work/ai/agent_chainlit/retrieval_storage"
        enhance_qwen_admin = EnhanceRetrieval(llm=llm_qwen, retrieval_flag=False, embedding_model_path="/work/ai/agent_chainlit/models", data_dir=DEFAULT_RETRIEVAL_DATA_PATH, index_dir=DEFAULT_RETRIEVAL_STORAGE_PATH)
        self.function_call_react_user = PlanningAgentCommunityAiUser(
            enhance_llm=enhance_qwen_admin
        )


    def _process_messages(self, messages: Any) -> List[Dict[str, str]]:
        """处理 messages 参数，支持字符串和列表格式"""
        if messages is None:
            return None
        
        # 打印接收到的原始数据
        print(f"接收到的 messages 原始数据: {messages}")
        print(f"messages 数据类型: {type(messages)}")
        
        # 如果是字符串，尝试解析为 JSON
        if isinstance(messages, str):
            try:
                parsed_messages = json.loads(messages)
                print(f"JSON 解析后的数据: {parsed_messages}")
                return parsed_messages
            except json.JSONDecodeError as e:
                print(f"JSON 解析失败: {e}")
                raise ValueError(f"Invalid JSON string in messages: {e}")
        
        # 如果已经是列表格式，直接返回
        elif isinstance(messages, list):
            return messages
        
        # 其他类型报错
        else:
            raise ValueError(f"messages must be either JSON string or list, got {type(messages)}")

        self.logger = logging.getLogger(self.__class__.__name__)


    def register_routes(self, app: FastAPI):
        """注册路由"""
        app.get("/health")(self.health)
        app.post("/chat")(self.chat)
        app.post("/chat/function_call/start/stream")(self.function_call_chat_start_stream)
        app.post("/chat/function_call/start")(self.function_call_chat_start)
        app.post("/chat/function_call")(self.function_call)
        app.post("/chat/suggestions")(self.suggestions)


    async def function_call_chat_start_stream(
        self,
        function_call_server_request: FunctionCallServerRequest
    ):
        """function call api"""
        try:
            question = function_call_server_request.question
            messages = function_call_server_request.messages
            
        except Exception as e:
            result = f"传参错误！{str(e)}"
            for item in result:
                yield item
        try:
            chunks = []
            async for chunk in self.function_call_start.execute(
                question=question,
                messages=messages,
                tools=tools_start
            ):
                chunks.append(chunk)
                yield chunk
            result = ''.join(chunks)
            self.logger.info(result)
        except Exception as e:
            import traceback
            result = f"fail to exec function call api, {str(e)}\n{traceback.format_exc()}"
            for item in result:
                yield item


    async def function_call_chat_start(
        self,
        function_call_server_request: FunctionCallServerRequest
    ):
        """function call api"""
        try:
            question = function_call_server_request.question
            messages = self._process_messages(function_call_server_request.messages)
            # messages = function_call_server_request.messages
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": f"传参错误！{str(e)}", "data": None, "timestamp": datetime.now().isoformat()}
            )
        
        try:
            chunks = []
            async for chunk in self.function_call_start.execute(
                question=question,
                messages=messages,
                tools=tools_start
            ):
                chunks.append(chunk)
            result = ''.join(chunks)
            return JSONResponse(
                status_code=200,
                content={"success": True, "data": result, "timestamp": datetime.now().isoformat()}
            )
        except Exception as e:
            import traceback
            result = f"fail to exec function call api, {str(e)}\n{traceback.format_exc()}"
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": result, "data": None, "timestamp": datetime.now().isoformat()}
            )


    async def function_call(
        self,
        function_call_server_request: FunctionCallServerRequest
    ):
        """function call api"""
        try:
            question = function_call_server_request.question
            is_ensure = function_call_server_request.is_ensure
            service_name = function_call_server_request.service_name
            service_name = "meal_assistance_subsystem" if service_name is None else service_name
            service_name = "meal_assistance_subsystem" if service_name not in service_config else service_name
            messages = self._process_messages(function_call_server_request.messages)
            if not messages:
                question = """以下对话使用中文回答：""" + question
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": f"传参错误！{str(e)}", "data": None, "timestamp": datetime.now().isoformat()}
            )
        print(f"service_name: -------------------------------------------------------------------- {service_name}")
        print(f"service_name: -------------------------------------------------------------------- {service_name}")
        print(f"service_name: -------------------------------------------------------------------- {service_name}")
        
        if service_name == "traditional_medical_service":
            try:
                response = await ollama_shizhen._whoami_text(
                    messages=messages,
                    timeout=120,
                    use_tool=False,
                    temperature=0.0,
                    tool_call_json=None
                )
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "data": response, "timestamp": datetime.now().isoformat()}
                )
            except Exception as e:
                import traceback
                result = f"fail to exec function call api, {str(e)}\n{traceback.format_exc()}"
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": result, "data": None, "timestamp": datetime.now().isoformat()}
                )
        
        
        try:
            chunks = []
            if REACT_FLAG:
                async for chunk in self.function_call_react_user.execute(
                    tools=service_config[service_name]["tools"],
                    question=question,
                    chat_history=messages
                ):
                    chunks.append(chunk)
            else:
                async for chunk in self.function_call_start.execute(
                    question=question,
                    messages=messages,
                    tools=service_config[service_name]["tools"],
                    is_ensure=is_ensure
                ):
                    chunks.append(chunk)
            result = ''.join(chunks)
            return JSONResponse(
                status_code=200,
                content={"success": True, "data": result, "timestamp": datetime.now().isoformat()}
            )
        except Exception as e:
            import traceback
            result = f"fail to exec function call api, {str(e)}\n{traceback.format_exc()}"
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": result, "data": None, "timestamp": datetime.now().isoformat()}
            )


    async def function_call_chat_food_user_server(
        self,
        function_call_server_request: FunctionCallServerRequest
    ):
        """function call api"""
        try:
            question = function_call_server_request.question
            is_ensure = function_call_server_request.is_ensure
            messages = self._process_messages(function_call_server_request.messages)
            if not messages:
                question = "以下对话使用中文回答：\n" + question
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": f"传参错误！{str(e)}", "data": None, "timestamp": datetime.now().isoformat()}
            )
        
        try:
            chunks = []
            print(f"question: --------------------------- {question}")
            print(f"question: --------------------------- {messages}")
            print(f"question: --------------------------- {is_ensure}")
            
            if REACT_FLAG:
                async for chunk in self.function_call_react_user.execute(
                    tools=tools_food_user,
                    question=question,
                    chat_history=messages,
                ):
                    chunks.append(chunk)
            else:
                async for chunk in self.function_call_start.execute(
                    question=question,
                    messages=messages,
                    tools=tools_food_user,
                    is_ensure=is_ensure
                ):
                    chunks.append(chunk)
            result = ''.join(chunks)
            return JSONResponse(
                status_code=200,
                content={"success": True, "data": result, "timestamp": datetime.now().isoformat()}
            )
        except Exception as e:
            import traceback
            result = f"fail to exec function call api, {str(e)}\n{traceback.format_exc()}"
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": result, "data": None, "timestamp": datetime.now().isoformat()}
            )


    async def suggestions(
        self,
        function_call_server_request: FunctionCallServerRequest
    ):
        """function call api"""
        try:
            question = function_call_server_request.question
            is_ensure = function_call_server_request.is_ensure
            service_name = function_call_server_request.service_name
            service_name = "meal_assistance_subsystem" if service_name is None else service_name
            service_name = "meal_assistance_subsystem" if service_name not in service_config else service_name
            messages = function_call_server_request.messages
            messages = self._process_messages(function_call_server_request.messages) if messages is not None else messages
            question = """请根据用户的问题和历史会话消息，提供3个相关的后续问题建议，
                格式为：
                <suggestions>
                1. 建议问题1
                2. 建议问题2  
                3. 建议问题3
                </suggestions>
            \n""" + question
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": f"传参错误！{str(e)}", "data": None, "timestamp": datetime.now().isoformat()}
            )
        
        try:
            chunks = []
            
            if REACT_FLAG:
                async for chunk in self.function_call_react_user.execute(
                    tools=service_config[service_name]["tools"],
                    question=question,
                    chat_history=messages,
                ):
                    chunks.append(chunk)
            else:
                async for chunk in self.function_call_start.execute(
                    question=question,
                    messages=messages,
                    tools=service_config[service_name]["tools"],
                    is_ensure=is_ensure
                ):
                    chunks.append(chunk)
            result = ''.join(chunks)
            return JSONResponse(
                status_code=200,
                content={"success": True, "data": result, "timestamp": datetime.now().isoformat()}
            )
        except Exception as e:
            import traceback
            result = f"fail to exec function call api, {str(e)}\n{traceback.format_exc()}"
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": result, "data": None, "timestamp": datetime.now().isoformat()}
            )





    async def chat(
        self, 
        request: Request
    ):
        """chat"""
        return JSONResponse(
            status_code=200,
            content={"success": True, "data": "尚未开发", "timestamp": datetime.now().isoformat()}
        )


    async def health(self):
        """健康检查"""
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": "null",
                "timestamp": datetime.now().isoformat()
            }
        )


def create_app():
    app = FastAPI(
        title="OnlyOffice文档编辑器",
        description="支持URL传参编辑、内容替换和回调保存的OnlyOffice编辑器服务",
        version="2.1.0"
    )
    from agent.config.llm_config import LLMConfig
    
    llm_qwen = OllamaLLM(config=LLMConfig.from_file(Path(QWEN_OLLAMA_CONFIG_PATH)))
    enhance_qwen_admin = EnhanceRetrieval(
        llm=llm_qwen, 
        retrieval_flag=False, 
        data_dir=RETRIEVAL_DATA_PATH, 
        index_dir=RETRIEVAL_STORAGE_PATH,
        embedding_model_path=MODEL_PATH
    )

    function_call_server = FunctionCallServer(
        enhance_retrieval=enhance_qwen_admin
    )
    function_call_server.register_routes(app)
    return app



def parse_arguments():
    """解析命令行参数"""
    parser = argparse.ArgumentParser(
        description="Function Call服务器",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python function_call_server.py                    # 使用默认端口 8002
  python function_call_server.py --port 8080       # 指定端口为 8080
  python function_call_server.py -p 9000           # 指定端口为 9000 (简写)
  python function_call_server.py --host 127.0.0.1  # 指定主机地址
        """
    )
    
    parser.add_argument(
        "--port", "-p",
        type=int,
        default=8002,
        help="服务器端口号 (默认: 8002)"
    )
    
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="服务器主机地址 (默认: 0.0.0.0)"
    )
    
    return parser.parse_args()


if __name__ == '__main__':
    import uvicorn
    args = parse_arguments()
    app = create_app()
    print("启动OnlyOffice编辑器: http://localhost:8002")
    print("支持URL传参编辑、内容替换和回调保存功能")
    print("保存API: https://ai.shunxikj.com:5002/api/files/upload")
    print("使用方式: /edit_url?url=文档URL&filename=文件名&replace_information=[{\"from\":\"原文本\",\"to\":\"新文本\"}]")
    ssl_certfile = str(ROOT_DIRECTORY / "cert" / "shunxikj.com.crt")
    ssl_keyfile = str(ROOT_DIRECTORY / "cert" / "shunxikj.com.key")
    
    
    run_kwargs = {
        "app": app,
        "host": "0.0.0.0",
        "port": args.port,
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
