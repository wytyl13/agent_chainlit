#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/27
@Author  : weiyutao
@File    : role_data_server.py
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
import logging
from pydantic import BaseModel
from typing import Optional
from fastapi.encoders import jsonable_encoder
import asyncio

from api.table.base.role_info import RoleInfo
from agent.provider.sql_provider import SqlProvider
from tools.utils import Utils

utils = Utils()


class RoleInfoServerRequest(BaseModel):
    role_name: Optional[str] = None
    role_code: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[str] = None
    role_status: Optional[int] = None


class RoleInfoServer:
    """角色服务类"""
    
    def __init__(self, sql_config_path: str):
        self.sql_config_path = sql_config_path
        self.logger = logging.getLogger(self.__class__.__name__)
        self.sql_provider = SqlProvider(model=RoleInfo, sql_config_path=self.sql_config_path)
    
    def register_routes(self, app: FastAPI):
        """注册角色相关的路由"""
        app.get("/api/role_info")(self.get_role_info)
        app.post("/api/role_info")(self.post_role_info)
        app.post("/api/role_info/save")(self.save_role_info)
        app.post("/api/role_info/update")(self.update_role_info)
        app.post("/api/role_info/delete")(self.delete_role_info)
    
    
    async def get_role_info(
        self,
        role_code: Optional[str] = None,
    ):
        """
        GET请求 - 支持获取所有角色（不传递任何参数）信息，支持获取指定角色（在url中传递role_code参数）信息
        Examples:
        - GET /api/role_data -> 获取所有角色信息
        - GET /api/role_data?role_code=admin -> 获取admin角色的信息
        """
        condition = {}
        if role_code is not None:
            condition["role_code"] = role_code
        
        sql_provider = None
        try:
            sql_provider = SqlProvider(model=RoleInfo, sql_config_path=self.sql_config_path)
            result = await sql_provider.get_record_by_condition(condition=condition)
            json_compatible_result = jsonable_encoder(result)
            
            return JSONResponse(
                status_code=200,
                content={"success": True, "data": json_compatible_result, "timestamp": datetime.now().isoformat()}
            )
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"获取角色数据失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
        finally:
            if sql_provider:
                await sql_provider.close()
                await asyncio.sleep(0.1)


    async def post_role_info(
        self,
        role_request: RoleInfoServerRequest,
    ):
        """
        POST请求 - 支持获取所有角色（使用JSON空白请求体）信息，支持获取指定角色（在JSON请求体中传递role_code参数）信息
        Examples:
        - POST /api/role_data {} -> 获取所有角色信息
        - POST /api/role_data {"role_code": "admin"} -> 获取admin角色的信息
        """
        try:
            role_code = role_request.role_code
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": f"传参错误！{str(e)}", "data": None, "timestamp": datetime.now().isoformat()}
            )
        
        try:
            result = await self.get_role_info(role_code)
            return result
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"获取角色数据失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
    
    
    async def save_role_info(
        self,
        role_request: RoleInfoServerRequest,
    ):
        """
        POST请求 - 保存角色数据
        """
        try:
            self.logger.info(f"收到角色数据保存请求: {role_request}")
            
            if not role_request.role_name:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供角色名称", "timestamp": datetime.now().isoformat()}
                )
            
            if not role_request.role_code:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供角色代码", "timestamp": datetime.now().isoformat()}
                )
            
            # 检查角色代码是否已存在
            role_data = RoleInfoServerRequest(role_code=role_request.role_code)
            response = await self.post_role_info(role_data)
            response = utils.parse_server_return(response)
            if response:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": f"""<confirm content="确认修改角色：{role_request.role_code}">角色{role_request.role_code}已经存在，请问您是否要修改？</confirm>""", "timestamp": datetime.now().isoformat()}
                )
            
            # 准备插入数据
            insert_data = {
                "role_name": role_request.role_name,
                "role_code": role_request.role_code,
                "create_time": datetime.now(),
                "update_time": datetime.now()
            }
            
            # 可选字段处理
            if hasattr(role_request, 'description') and role_request.description:
                insert_data["description"] = role_request.description
            else:
                insert_data["description"] = f"{role_request.role_name}角色"
                
            if hasattr(role_request, 'permissions') and role_request.permissions:
                insert_data["permissions"] = role_request.permissions
            else:
                insert_data["permissions"] = "[]"  # 默认空权限列表
                
            if hasattr(role_request, 'role_status') and role_request.role_status is not None:
                insert_data["role_status"] = role_request.role_status
            else:
                insert_data["role_status"] = 1  # 默认启用
                
            result = await self.sql_provider.add_record(insert_data)
            
            if result:
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": "角色保存成功", "data": str(result), "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": "数据库添加记录失败", "timestamp": datetime.now().isoformat()}
                )
                
        except Exception as e:
            self.logger.error(f"保存角色数据失败: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"保存失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
            
            
    async def update_role_info(
        self,
        role_request: RoleInfoServerRequest,
    ):
        """
        POST请求 - 更新角色数据
        """
        try:
            self.logger.info(f"收到角色数据更新请求: {role_request}")
            
            if not role_request.role_code:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供角色代码", "timestamp": datetime.now().isoformat()}
                )
            
            # 查询现有角色数据
            role_data = RoleInfoServerRequest(role_code=role_request.role_code)
            response = await self.post_role_info(role_data)
            import json
            if hasattr(response, 'body'):
                response = json.loads(response.body.decode())
            if response.get("success"):
                response = response.get("data", [])
                print(f"查询到 {len(response)} 条角色记录")
            else:
                response = []
                print(f"查询失败: {response.get('message')}")
            
            if not response:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": f"角色{role_request.role_code}不存在", "timestamp": datetime.now().isoformat()}
                )
            
            # 准备更新数据
            response = response[0]
            insert_data = {
                "role_code": role_request.role_code,
                "update_time": datetime.now()
            }
            
            # 更新字段
            if hasattr(role_request, 'role_name') and role_request.role_name:
                insert_data["role_name"] = role_request.role_name
            else:
                insert_data["role_name"] = response["role_name"]
                
            if hasattr(role_request, 'description') and role_request.description:
                insert_data["description"] = role_request.description
            else:
                insert_data["description"] = response["description"]
                
            if hasattr(role_request, 'permissions') and role_request.permissions:
                insert_data["permissions"] = role_request.permissions
            else:
                insert_data["permissions"] = response["permissions"]
                
            if hasattr(role_request, 'role_status') and role_request.role_status is not None:
                insert_data["role_status"] = role_request.role_status
            else:
                insert_data["role_status"] = response["role_status"]
            
            # 删除旧记录并添加新记录
            delete_result = await self.sql_provider.delete_record(record_id=response["id"], hard_delete=True)
            result = await self.sql_provider.add_record(insert_data)
            
            if result:
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": "角色更新成功", "data": str(result), "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": "数据库更新记录失败", "timestamp": datetime.now().isoformat()}
                )
                
        except Exception as e:
            import traceback
            self.logger.error(f"更新角色数据失败: {str(e)}\n{traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"更新失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
            
            
    async def delete_role_info(
        self,
        role_request: RoleInfoServerRequest,
    ):
        """
        POST请求 - 删除角色数据
        """
        try:
            self.logger.info(f"收到角色数据删除请求: {role_request}")
            
            if not role_request.role_code:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供要删除的角色代码", "timestamp": datetime.now().isoformat()}
                )
            
            # 查询角色是否存在
            role_data = RoleInfoServerRequest(role_code=role_request.role_code)
            response = await self.post_role_info(role_data)
            import json
            if hasattr(response, 'body'):
                response = json.loads(response.body.decode())
            if response.get("success"):
                response = response.get("data", [])
                print(f"查询到 {len(response)} 条角色记录")
            else:
                response = []
                print(f"查询失败: {response.get('message')}")
            
            if response:
                response = response[0]
                delete_result = await self.sql_provider.delete_record(record_id=response["id"], hard_delete=True)
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": f"角色{role_request.role_code}删除成功", "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": f"删除失败！角色{role_request.role_code}不存在", "timestamp": datetime.now().isoformat()}
                )
                
        except Exception as e:
            import traceback
            self.logger.error(f"删除角色失败: {str(e)}\n{traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"删除角色失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )


if __name__ == '__main__':
    from pathlib import Path
    import asyncio
    ROOT_DIRECTORY = Path(__file__).parent.parent.parent.parent
    SQL_CONFIG_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / "sql_config.yaml")
    
    async def main():
        role_server = RoleInfoServer(sql_config_path=SQL_CONFIG_PATH)
        response = await role_server.get_role_info()
        print(response)
        
    asyncio.run(main())