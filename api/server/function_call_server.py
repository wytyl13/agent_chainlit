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
from typing import Optional, List, Dict, Any
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

client_service = ClientService()
order = Order()
role = Role()
food_service = FoodService()
tools_start = [client_service, order, role, food_service]




class FunctionCallServerRequest(BaseModel):
    question: str = None
    messages: Optional[List[Dict[str, str]]] = None
    stream: Optional[bool] = True


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


    def register_routes(self, app: FastAPI):
        """注册路由"""
        app.get("/health")(self.health)
        app.post("/chat")(self.chat)
        app.post("/chat/function_call/start/stream")(self.function_call_chat_start_stream)
        app.post("/chat/function_call/start")(self.function_call_chat_start)


    # async def function_call_chat_start(
    #     self,
    #     function_call_server_request: FunctionCallServerRequest
    # ):
    #     """function call api"""
    #     try:
    #         question = function_call_server_request.question
    #         messages = function_call_server_request.messages
    #         stream = function_call_server_request.stream
    #     except Exception as e:
    #         return JSONResponse(
    #             status_code=400,
    #             content={"success": False, "message": f"传参错误！{str(e)}", "data": None, "timestamp": datetime.now().isoformat()}
    #         )
        
    #     try:
    #         chunks = []
    #         async for chunk in self.function_call_start.execute(
    #             question=question,
    #             messages=messages,
    #             tools=tools_start
    #         ):
    #             chunks.append(chunk)
    #             if stream:
    #                 yield chunk
    #         result = ''.join(chunks)
    #         if not stream:
    #             return JSONResponse(
    #                 status_code=200,
    #                 content={"success": True, "data": result, "timestamp": datetime.now().isoformat()}
    #             )
    #     except Exception as e:
    #         result = f"fail to exec function call api, {str(e)}"
    #         if stream:
    #             for item in result:
    #                 yield item
    #         else:
    #             return JSONResponse(
    #                 status_code=500,
    #                 content={"success": False, "message": result, "data": None, "timestamp": datetime.now().isoformat()}
    #             )
                
                
                
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
            messages = function_call_server_request.messages
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
