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

REACT_FLAG = 0

client_service = ClientService()
order = Order()
role = Role()
food_service = FoodService()
government_grant = GovernmentGrant()
procurement_project = ProcurementProject()
tools_start = [client_service, order, role, food_service,government_grant,procurement_project]




menu_service = MenuService()
tools_food_manager = [menu_service]

order_food_tool = OrderFoodTool()
list_menu_tool = ListMenu()
tools_food_user = [order_food_tool, list_menu_tool]


class FunctionCallServerRequest(BaseModel):
    question: str = None
    messages: Optional[Union[str, List[Dict[str, str]]]] = None
    stream: Optional[bool] = True
    is_ensure: Optional[int] = 0
    


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
            tools = tools_start,
            enhance_llm=self.enhance_retrieval,
        )
        from agent.config.llm_config import LLMConfig
        QWEN_OLLAMA_CONFIG_PATH = "/work/ai/agent_chainlit/config/yaml/ollama_config.yaml"
        llm_qwen = OllamaLLM(config=LLMConfig.from_file(Path(QWEN_OLLAMA_CONFIG_PATH)))
        DEFAULT_RETRIEVAL_DATA_PATH = "/work/ai/agent_chainlit/retrieval_data"
        DEFAULT_RETRIEVAL_STORAGE_PATH = "/work/ai/agent_chainlit/retrieval_storage"
        enhance_qwen_admin = EnhanceRetrieval(llm=llm_qwen, retrieval_flag=False, embedding_model_path="/work/ai/agent_chainlit/models", data_dir=DEFAULT_RETRIEVAL_DATA_PATH, index_dir=DEFAULT_RETRIEVAL_STORAGE_PATH)
        self.function_call_react_user = PlanningAgentCommunityAiUser(
            tools=tools_food_manager, 
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
        app.post("/chat/function_call/food_manager_server")(self.function_call_chat_food_manager_server)
        app.post("/chat/function_call/food_user_server")(self.function_call_chat_food_user_server)


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


    async def function_call_chat_food_manager_server(
        self,
        function_call_server_request: FunctionCallServerRequest
    ):
        """function call api"""
        try:
            question = function_call_server_request.question
            messages = self._process_messages(function_call_server_request.messages)
            if not messages:
                question = "以下对话使用中文回答：如果用户明确下单ensure参数赋值为1，否则为0\n" + question
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": f"传参错误！{str(e)}", "data": None, "timestamp": datetime.now().isoformat()}
            )
        
        try:
            chunks = []
            print(f"question: --------------------------- {question}")
            print(f"question: --------------------------- {messages}")
            
            if REACT_FLAG:
                async for chunk in self.function_call_react_user.execute(
                    tools=tools_food_manager,
                    question=question,
                    chat_history=messages
                ):
                    chunks.append(chunk)
            else:
                async for chunk in self.function_call_start.execute(
                    question=question,
                    messages=messages,
                    tools=tools_food_manager
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
    
    QWEN_OLLAMA_CONFIG_PATH = "/work/ai/agent_chainlit/config/yaml/ollama_config.yaml"
    llm_qwen = OllamaLLM(config=LLMConfig.from_file(Path(QWEN_OLLAMA_CONFIG_PATH)))
    DEFAULT_RETRIEVAL_DATA_PATH = "/work/ai/agent_chainlit/retrieval_data"
    DEFAULT_RETRIEVAL_STORAGE_PATH = "/work/ai/agent_chainlit/retrieval_storage"
    enhance_qwen_admin = EnhanceRetrieval(
        llm=llm_qwen, 
        retrieval_flag=False, 
        data_dir=DEFAULT_RETRIEVAL_DATA_PATH, 
        index_dir=DEFAULT_RETRIEVAL_STORAGE_PATH,
        embedding_model_path="/work/ai/agent/models"
    )

    function_call_server = FunctionCallServer(
        enhance_retrieval=EnhanceRetrieval
    )
    function_call_server.register_routes(app)
    return app


if __name__ == '__main__':
    import uvicorn
    app = create_app()
    print("启动OnlyOffice编辑器: http://localhost:8002")
    print("支持URL传参编辑、内容替换和回调保存功能")
    print("保存API: https://ai.shunxikj.com:5002/api/files/upload")
    print("使用方式: /edit_url?url=文档URL&filename=文件名&replace_information=[{\"from\":\"原文本\",\"to\":\"新文本\"}]")
    uvicorn.run(app, host="0.0.0.0", port=8002, log_level="info")
