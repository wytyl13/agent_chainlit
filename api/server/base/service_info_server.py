#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/08/06 11:22
@Author  : weiyutao
@File    : user_data_server.py
"""



from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
import logging
from pydantic import BaseModel
from typing import (
    Optional
)
from fastapi.encoders import jsonable_encoder
import asyncio
from pathlib import Path
import json


from api.server.function_call.function_call_server import service_config_list
from agent.provider.sql_provider import SqlProvider
from api.table.base.user_data import UserData
from api.table.base.role_info import RoleInfo


ROOT_DIRECTORY = Path(__file__).parent.parent.parent.parent
SQL_CONFIG_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / "sql_config.yaml")

from tools.utils import Utils


utils = Utils()


service_config_list_without_tools = [{k: v for k, v in item.items() if k != 'tools'} for item in service_config_list]


class RoleInfoServerRequest(BaseModel):
    username: Optional[str] = None
    role_code: Optional[str] = None



class ServiceInfoServer:
    """用户服务类"""
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
    
    
    def register_routes(self, app: FastAPI):
        """注册用户相关的路由"""
        app.get("/api/service_info")(self.get_service_info)
        app.post("/api/service_info")(self.post_service_info)
    
    
    async def get_service_info(
        self,
        username: Optional[str] = None,
        role_code: Optional[str] = None
    ):
        """
        """
        service_config_list = []
        condition = {}
        permissions = ""
        user_data_sql_provider = None
        role_info_sql_provider = None
        try:
            if role_code is None:
                if username is not None:
                    condition_user = {}
                    condition_user["username"] = username
                    try:
                        user_data_sql_provider = SqlProvider(model=UserData, sql_config_path=SQL_CONFIG_PATH)
                        result = await user_data_sql_provider.get_record_by_condition(
                            condition=condition_user,
                            fields=["id", "username", "password", "full_name", "gender", "age", "address", "phone", "email", "status", "create_time", "tenant_id", "role", "community"]
                        )
                        if result:
                            role_code = result[0]["role"]
                    except Exception as e:
                        return JSONResponse(
                            status_code=500,
                            content={"success": False, "message": str(e), "timestamp": datetime.now().isoformat()}
                        )
                else:
                    return JSONResponse(
<<<<<<< HEAD
                        status_code=400,
                        content={"success": False, "message": "参数传递错误！", "timestamp": datetime.now().isoformat()}
                    )
            
=======
                        status_code=200,
                        content={"success": True, "data": service_config_list_without_tools, "timestamp": datetime.now().isoformat()}
                    )
>>>>>>> weiyutao
            condition["role_code"] = role_code
            try:
                role_info_sql_provider = SqlProvider(model=RoleInfo, sql_config_path=SQL_CONFIG_PATH)
                result = await role_info_sql_provider.get_record_by_condition(
                    condition=condition,
                    fields=["role_name", "role_code", "description", "permissions", "role_status"]
                )
                if result:
                    permissions = result[0]["permissions"]
                    if not permissions:
                        permission_list = []
                    else:
                        try:
                            permission_list = json.loads(permissions)
                            if not isinstance(permission_list, list):
                                self.logger.warning(f"角色 {role_code} 的权限不是列表格式: {permissions}")
                                permission_list = []
                        except (json.JSONDecodeError, TypeError) as e:
                            self.logger.error(f"角色 {role_code} 的权限解析失败: {permissions}, 错误: {str(e)}")
                            permission_list = []
                    service_info_list = [
                        service for service in service_config_list_without_tools 
                        if service['service_id'] in permission_list
                    ]
                    
                    return JSONResponse(
                        status_code=200,
                        content={"success": True, "data": service_info_list, "timestamp": datetime.now().isoformat()}
                    )
                else:
                    return JSONResponse(
                        status_code=500,
                        content={"success": False, "message": "执行错误！", "timestamp": datetime.now().isoformat()}
                    )
            except Exception as e:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": str(e), "timestamp": datetime.now().isoformat()}
                )
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": str(e), "timestamp": datetime.now().isoformat()}
            )
        finally:
            # 确保关闭数据库连接
            if user_data_sql_provider:
                await user_data_sql_provider.close()
            if role_info_sql_provider:
                await role_info_sql_provider.close()
            await asyncio.sleep(0.1)
        

    async def post_service_info(
        self,
        role_info_request: RoleInfoServerRequest = None
    ):
        """
        """
        # 参数验证
        if not role_info_request:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "请求体不能为空", "timestamp": datetime.now().isoformat()}
            )
        try:
            username = role_info_request.username
            role_code = role_info_request.role_code
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": f"传参错误！{str(e)}", "data": None, "timestamp": datetime.now().isoformat()}
            )
        try:
            result = await self.get_service_info(username=username, role_code=role_code)
            return result
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"获取服务配置失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )