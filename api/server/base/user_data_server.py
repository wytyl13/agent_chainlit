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


from api.table.base.user_data import UserData
from agent.provider.sql_provider import SqlProvider
from tools.utils import Utils


utils = Utils()

class ListUserData(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None
    role: Optional[str] = None
    community: Optional[str] = None
    tenant_id: Optional[int] = None


class UserDataServer:
    """用户服务类"""

    def __init__(self, sql_config_path: str):
        self.sql_config_path = sql_config_path
        self.logger = logging.getLogger(self.__class__.__name__)


    def register_routes(self, app: FastAPI):
        """注册用户相关的路由"""
        app.get("/api/user_data")(self.get_user_data)
        app.post("/api/user_data")(self.post_user_data)
        app.post("/api/user_data/save")(self.save_user_data)
        app.post("/api/user_data/update")(self.update_user_data)
        app.post("/api/user_data/delete")(self.delete_user_data)

    async def get_user_data(
        self,
        username: Optional[str] = None,
    ):
        """
        GET请求 - 支持获取所有用户（不传递任何参数）信息，支持获取指定用户（在url中传递username参数）信息
        Examples:
        - GET /api/user_data -> 获取所有用户信息
        - GET /api/user_data?username=john -> 获取john用户的设备信息
        """
        condition = {}
        print(f"condition: ---------------------- {condition}")
        if username is not None:
            condition["username"] = username
        try:
            sql_provider = SqlProvider(model=UserData, sql_config_path=self.sql_config_path)
            result = await sql_provider.get_record_by_condition(
                condition=condition,
                fields=["id", "username", "password", "full_name", "gender", "age", "address", "phone", "email", "status", "create_time", "tenant_id", "role", "community"]
            )
            json_compatible_result = jsonable_encoder(result)
            
            return JSONResponse(
                status_code=200,
                content={"success": True, "data": json_compatible_result, "timestamp": datetime.now().isoformat()}
            )
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"获取用户数据失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
        finally:
            if sql_provider:
                await sql_provider.close()
                # 等待一小段时间确保连接完全关闭
                await asyncio.sleep(0.1)


    async def post_user_data(
        self,
        list_user_data: ListUserData,
    ):
        """
        POST请求 - 支持获取所有用户（使用JSON空白请求体）信息，支持获取指定用户（在JSON请求体中传递username参数）信息
        Examples:
        - POST /api/user_data {} -> 获取所有用户信息
        - POST /api/user_data {"username": "JOHN"} -> 获取JOHN用户的设备信息
        """
        # 无效代码-----------------------------------------------------------------------------------------
        try:
            username = list_user_data.username
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": f"传参错误！{str(e)}", "data": None, "timestamp": datetime.now().isoformat()}
            )
        # 无效代码-----------------------------------------------------------------------------------------
        try:
            result = await self.get_user_data(username)
            return result
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"获取用户数据失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )

    
    async def save_user_data(
        self,
        list_user_data: ListUserData,
    ):
        """
        POST请求 - 保存用户数据
        """
        sql_provider = None
        try:
            self.logger.info(f"收到用户数据保存请求: {list_user_data}")
            
            if not list_user_data.username:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供用户名", "timestamp": datetime.now().isoformat()}
                )
            
            if not list_user_data.password:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供密码", "timestamp": datetime.now().isoformat()}
                )
            
            if not list_user_data.full_name:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供姓名", "timestamp": datetime.now().isoformat()}
                )
            
            # 检查用户名是否已存在
            user_data = ListUserData(username=list_user_data.username)
            response = await self.post_user_data(user_data)
            response = utils.parse_server_return(response)
            if response:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": f"""<confirm content="确认修改用户：{list_user_data.username}">用户{list_user_data.username}已经存在，请问您是否要修改？</confirm>""", "timestamp": datetime.now().isoformat()}
                )
            
            # 准备插入数据
            insert_data = {
                "username": list_user_data.username,
                "password": list_user_data.password,
                "full_name": list_user_data.full_name,
                "create_time": datetime.now(),
                "update_time": datetime.now()
            }
            
            # 可选字段处理
            if hasattr(list_user_data, 'gender') and list_user_data.gender:
                insert_data["gender"] = list_user_data.gender
            
            if hasattr(list_user_data, 'age') and list_user_data.age is not None:
                insert_data["age"] = list_user_data.age
                
            if hasattr(list_user_data, 'address') and list_user_data.address:
                insert_data["address"] = list_user_data.address
                
            if hasattr(list_user_data, 'phone') and list_user_data.phone:
                insert_data["phone"] = list_user_data.phone
                
            if hasattr(list_user_data, 'email') and list_user_data.email:
                insert_data["email"] = list_user_data.email
                
            if hasattr(list_user_data, 'status') and list_user_data.status:
                insert_data["status"] = list_user_data.status
            else:
                insert_data["status"] = "active"
                
            if hasattr(list_user_data, 'role') and list_user_data.role:
                insert_data["role"] = list_user_data.role
            else:
                insert_data["role"] = "user"  # 默认角色
                
            if hasattr(list_user_data, 'community') and list_user_data.community:
                insert_data["community"] = list_user_data.community
                
            if hasattr(list_user_data, 'tenant_id') and list_user_data.tenant_id is not None:
                insert_data["tenant_id"] = list_user_data.tenant_id
            else:
                insert_data["tenant_id"] = 0
            
            sql_provider = SqlProvider(model=UserData, sql_config_path=self.sql_config_path)
            result = await sql_provider.add_record(insert_data)
            
            if result:
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": "用户保存成功", "data": str(result), "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": "数据库添加记录失败", "timestamp": datetime.now().isoformat()}
                )
                
        except Exception as e:
            self.logger.error(f"保存用户数据失败: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"保存失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
        finally:
            if sql_provider:
                await sql_provider.close()
                await asyncio.sleep(0.1)


    async def update_user_data(
        self,
        list_user_data: ListUserData,
    ):
        """
        POST请求 - 更新用户数据
        """
        sql_provider = None
        try:
            self.logger.info(f"收到用户数据更新请求: {list_user_data}")
            
            if not list_user_data.username:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供用户名", "timestamp": datetime.now().isoformat()}
                )
            
            # 查询现有用户数据
            user_data = ListUserData(username=list_user_data.username)
            response = await self.post_user_data(user_data)
            
            if hasattr(response, 'body'):
                response = json.loads(response.body.decode())
            if response.get("success"):
                response = response.get("data", [])
                print(f"查询到 {len(response)} 条用户记录")
            else:
                response = []
                print(f"查询失败: {response.get('message')}")
            
            if not response:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": f"用户{list_user_data.username}不存在", "timestamp": datetime.now().isoformat()}
                )
            
            # 准备更新数据
            response = response[0]
            insert_data = {
                "username": list_user_data.username,
                "update_time": datetime.now()
            }
            
            # 更新字段
            if hasattr(list_user_data, 'password') and list_user_data.password:
                insert_data["password"] = list_user_data.password
            else:
                insert_data["password"] = response["password"]
                
            if hasattr(list_user_data, 'full_name') and list_user_data.full_name:
                insert_data["full_name"] = list_user_data.full_name
            else:
                insert_data["full_name"] = response["full_name"]
                
            if hasattr(list_user_data, 'gender') and list_user_data.gender:
                insert_data["gender"] = list_user_data.gender
            else:
                insert_data["gender"] = response.get("gender")
                
            if hasattr(list_user_data, 'age') and list_user_data.age is not None:
                insert_data["age"] = list_user_data.age
            else:
                insert_data["age"] = response.get("age")
                
            if hasattr(list_user_data, 'address') and list_user_data.address:
                insert_data["address"] = list_user_data.address
            else:
                insert_data["address"] = response.get("address")
                
            if hasattr(list_user_data, 'phone') and list_user_data.phone:
                insert_data["phone"] = list_user_data.phone
            else:
                insert_data["phone"] = response.get("phone")
                
            if hasattr(list_user_data, 'email') and list_user_data.email:
                insert_data["email"] = list_user_data.email
            else:
                insert_data["email"] = response.get("email")
                
            if hasattr(list_user_data, 'status') and list_user_data.status:
                insert_data["status"] = list_user_data.status
            else:
                insert_data["status"] = response.get("status", "active")
                
            if hasattr(list_user_data, 'role') and list_user_data.role:
                insert_data["role"] = list_user_data.role
            else:
                insert_data["role"] = response.get("role")
                
            if hasattr(list_user_data, 'community') and list_user_data.community:
                insert_data["community"] = list_user_data.community
            else:
                insert_data["community"] = response.get("community")
                
            if hasattr(list_user_data, 'tenant_id') and list_user_data.tenant_id is not None:
                insert_data["tenant_id"] = list_user_data.tenant_id
            else:
                insert_data["tenant_id"] = response.get("tenant_id", 0)
            
            # 删除旧记录并添加新记录
            sql_provider = SqlProvider(model=UserData, sql_config_path=self.sql_config_path)
            delete_result = await sql_provider.delete_record(record_id=response["id"], hard_delete=True)
            result = await sql_provider.add_record(insert_data)
            
            if result:
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": "用户更新成功", "data": str(result), "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": "数据库更新记录失败", "timestamp": datetime.now().isoformat()}
                )
                
        except Exception as e:
            import traceback
            self.logger.error(f"更新用户数据失败: {str(e)}\n{traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"更新失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
        finally:
            if sql_provider:
                await sql_provider.close()
                await asyncio.sleep(0.1)

    async def delete_user_data(
        self,
        list_user_data: ListUserData,
    ):
        """
        POST请求 - 删除用户数据
        """
        sql_provider = None
        try:
            self.logger.info(f"收到用户数据删除请求: {list_user_data}")
            
            if not list_user_data.username:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供要删除的用户名", "timestamp": datetime.now().isoformat()}
                )
            
            # 查询用户是否存在
            user_data = ListUserData(username=list_user_data.username)
            response = await self.post_user_data(user_data)
            
            if hasattr(response, 'body'):
                response = json.loads(response.body.decode())
            if response.get("success"):
                response = response.get("data", [])
                print(f"查询到 {len(response)} 条用户记录")
            else:
                response = []
                print(f"查询失败: {response.get('message')}")
            
            if response:
                response = response[0]
                sql_provider = SqlProvider(model=UserData, sql_config_path=self.sql_config_path)
                delete_result = await sql_provider.delete_record(record_id=response["id"], hard_delete=True)
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": f"用户{list_user_data.username}删除成功", "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": f"删除失败！用户{list_user_data.username}不存在", "timestamp": datetime.now().isoformat()}
                )
                
        except Exception as e:
            import traceback
            self.logger.error(f"删除用户失败: {str(e)}\n{traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"删除用户失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
        finally:
            if sql_provider:
                await sql_provider.close()
                await asyncio.sleep(0.1)


if __name__ == '__main__':
    from pathlib import Path
    import asyncio
    
    ROOT_DIRECTORY = Path(__file__).parent.parent.parent.parent
    SQL_CONFIG_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / "sql_config.yaml")
    
    async def main():
        user_server = UserDataServer(sql_config_path=SQL_CONFIG_PATH)
        response = await user_server.get_user_data()
        print(response)
        
    asyncio.run(main())