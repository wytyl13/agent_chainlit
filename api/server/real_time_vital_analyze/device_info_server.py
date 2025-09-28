#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/27
@Author  : weiyutao
@File    : device_info_server.py
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
import logging
from pydantic import BaseModel
from typing import Optional
from fastapi.encoders import jsonable_encoder
import asyncio

from api.table.real_time_vital_analyze.device_info import DeviceInfo
from agent.provider.sql_provider import SqlProvider
from tools.utils import Utils

utils = Utils()

class DeviceInfoRequest(BaseModel):
    device_id: Optional[str] = None
    device_type: Optional[str] = None
    device_name: Optional[str] = None
    user_name: Optional[str] = None
    device_status: Optional[int] = None
    creator: Optional[str] = None
    updater: Optional[str] = None

class DeviceInfoServer:
    """设备信息服务类"""
    
    def __init__(self, sql_config_path: str):
        self.sql_config_path = sql_config_path
        self.logger = logging.getLogger(self.__class__.__name__)
        self.sql_provider = SqlProvider(model=DeviceInfo, sql_config_path=self.sql_config_path)
    
    def register_routes(self, app: FastAPI):
        """注册设备信息相关的路由"""
        app.get("/api/device_info")(self.get_device_info)
        app.post("/api/device_info")(self.post_device_info)
        app.post("/api/device_info/save")(self.save_device_info)
        app.post("/api/device_info/update")(self.update_device_info)
        app.post("/api/device_info/delete")(self.delete_device_info)
        app.get("/api/device_info/status/{device_id}")(self.get_device_status)
        app.post("/api/device_info/status/update")(self.update_device_status)
    
    async def get_device_info(
        self,
        device_id: Optional[str] = None,
        device_type: Optional[str] = None,
        user_name: Optional[str] = None,
        device_status: Optional[int] = None,
    ):
        """
        GET请求 - 获取设备信息
        Examples:
        - GET /api/device_info -> 获取所有设备信息
        - GET /api/device_info?device_id=DEV001 -> 获取指定设备信息
        - GET /api/device_info?device_type=sleep_monitor -> 获取指定类型设备
        - GET /api/device_info?device_status=1 -> 获取在线设备
        """
        condition = {}
        if device_id is not None:
            condition["device_id"] = device_id
        if device_type is not None:
            condition["device_type"] = device_type
        if user_name is not None:
            condition["user_name"] = user_name
        if device_status is not None:
            condition["device_status"] = device_status
            
        sql_provider = None
        try:
            sql_provider = SqlProvider(model=DeviceInfo, sql_config_path=self.sql_config_path)
            result = await sql_provider.get_record_by_condition(condition=condition)
            json_compatible_result = jsonable_encoder(result)
            
            return JSONResponse(
                status_code=200,
                content={
                    "success": True, 
                    "data": json_compatible_result, 
                    "count": len(json_compatible_result) if isinstance(json_compatible_result, list) else 1,
                    "timestamp": datetime.now().isoformat()
                }
            )
        except Exception as e:
            self.logger.error(f"获取设备信息失败: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"获取设备信息失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
        finally:
            if sql_provider:
                await sql_provider.close()
                await asyncio.sleep(0.1)

    async def post_device_info(self, device_request: DeviceInfoRequest):
        """
        POST请求 - 查询设备信息
        Examples:
        - POST /api/device_info {} -> 获取所有设备信息
        - POST /api/device_info {"device_id": "DEV001"} -> 获取指定设备信息
        """
        try:
            result = await self.get_device_info(
                device_id=device_request.device_id,
                device_type=device_request.device_type,
                user_name=device_request.user_name,
                device_status=device_request.device_status
            )
            return result
        except Exception as e:
            self.logger.error(f"查询设备信息失败: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"查询设备信息失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )

    async def save_device_info(self, device_request: DeviceInfoRequest):
        """
        POST请求 - 保存设备信息
        """
        try:
            self.logger.info(f"收到设备信息保存请求: {device_request}")
            
            # 验证必填字段
            if not device_request.device_id:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供设备编号", "timestamp": datetime.now().isoformat()}
                )
            
            if not device_request.device_type:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供设备类型", "timestamp": datetime.now().isoformat()}
                )
            
            if device_request.device_status is None:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供设备状态", "timestamp": datetime.now().isoformat()}
                )
            
            # 检查设备是否已存在
            check_device = DeviceInfoRequest(device_id=device_request.device_id)
            response = await self.post_device_info(check_device)
            response_data = utils.parse_server_return(response)
            
            if response_data:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False, 
                        "message": f"""<confirm content="确认修改设备：{device_request.device_id}">设备{device_request.device_id}已经存在，请问您是否要修改？</confirm>""", 
                        "timestamp": datetime.now().isoformat()
                    }
                )
            
            # 准备插入数据
            insert_data = {
                "device_id": device_request.device_id,
                "device_type": device_request.device_type,
                "device_status": device_request.device_status,
                "create_time": datetime.now(),
                "update_time": datetime.now()
            }
            
            # 可选字段
            if device_request.device_name:
                insert_data["device_name"] = device_request.device_name
            if device_request.user_name:
                insert_data["user_name"] = device_request.user_name
            if device_request.creator:
                insert_data["creator"] = device_request.creator
            
            # 插入数据库
            result = await self.sql_provider.add_record(insert_data)
            
            if result:
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": "设备信息保存成功", "data": str(result), "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": "数据库添加记录失败", "timestamp": datetime.now().isoformat()}
                )
                
        except Exception as e:
            self.logger.error(f"保存设备信息失败: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"保存失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )

    async def update_device_info(self, device_request: DeviceInfoRequest):
        """
        POST请求 - 更新设备信息
        """
        try:
            self.logger.info(f"收到设备信息更新请求: {device_request}")
            
            if not device_request.device_id:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供设备编号", "timestamp": datetime.now().isoformat()}
                )
            
            # 查询现有设备信息
            check_device = DeviceInfoRequest(device_id=device_request.device_id)
            response = await self.post_device_info(check_device)
            
            import json
            if hasattr(response, 'body'):
                response_data = json.loads(response.body.decode())
            else:
                response_data = response
                
            if response_data.get("success"):
                existing_devices = response_data.get("data", [])
                if not existing_devices:
                    return JSONResponse(
                        status_code=404,
                        content={"success": False, "message": f"设备{device_request.device_id}不存在", "timestamp": datetime.now().isoformat()}
                    )
                existing_device = existing_devices[0]
            else:
                return JSONResponse(
                    status_code=404,
                    content={"success": False, "message": f"设备{device_request.device_id}不存在", "timestamp": datetime.now().isoformat()}
                )
            
            # 准备更新数据
            update_data = {
                "device_id": device_request.device_id,
                "update_time": datetime.now()
            }
            
            # 更新字段，如果未提供则保持原值
            update_data["device_type"] = device_request.device_type if device_request.device_type else existing_device["device_type"]
            update_data["device_name"] = device_request.device_name if device_request.device_name else existing_device.get("device_name")
            update_data["user_name"] = device_request.user_name if device_request.user_name else existing_device.get("user_name")
            update_data["device_status"] = device_request.device_status if device_request.device_status is not None else existing_device["device_status"]
            update_data["creator"] = existing_device.get("creator")  # 保持原创建者
            if device_request.updater:
                update_data["updater"] = device_request.updater
            
            # 删除旧记录并插入新记录
            delete_result = await self.sql_provider.delete_record(record_id=existing_device["id"], hard_delete=True)
            result = await self.sql_provider.add_record(update_data)
            
            if result:
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": "设备信息更新成功", "data": str(result), "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": "数据库更新记录失败", "timestamp": datetime.now().isoformat()}
                )
                
        except Exception as e:
            import traceback
            self.logger.error(f"更新设备信息失败: {str(e)}\n{traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"更新失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )

    async def delete_device_info(self, device_request: DeviceInfoRequest):
        """
        POST请求 - 删除设备信息
        """
        try:
            self.logger.info(f"收到设备信息删除请求: {device_request}")
            
            if not device_request.device_id:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供要删除的设备编号", "timestamp": datetime.now().isoformat()}
                )
            
            # 查询设备是否存在
            check_device = DeviceInfoRequest(device_id=device_request.device_id)
            response = await self.post_device_info(check_device)
            
            import json
            if hasattr(response, 'body'):
                response_data = json.loads(response.body.decode())
            else:
                response_data = response
                
            if response_data.get("success"):
                existing_devices = response_data.get("data", [])
                if not existing_devices:
                    return JSONResponse(
                        status_code=404,
                        content={"success": False, "message": f"删除失败！设备{device_request.device_id}不存在", "timestamp": datetime.now().isoformat()}
                    )
                existing_device = existing_devices[0]
                
                # 执行删除
                delete_result = await self.sql_provider.delete_record(record_id=existing_device["id"], hard_delete=True)
                
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": f"设备{device_request.device_id}删除成功", "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=404,
                    content={"success": False, "message": f"删除失败！设备{device_request.device_id}不存在", "timestamp": datetime.now().isoformat()}
                )
                
        except Exception as e:
            import traceback
            self.logger.error(f"删除设备失败: {str(e)}\n{traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"删除设备失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )

    async def get_device_status(self, device_id: str):
        """
        GET请求 - 获取指定设备的状态
        """
        try:
            result = await self.get_device_info(device_id=device_id)
            
            if hasattr(result, 'body'):
                import json
                response_data = json.loads(result.body.decode())
            else:
                response_data = result
                
            if response_data.get("success") and response_data.get("data"):
                device_data = response_data["data"][0] if isinstance(response_data["data"], list) else response_data["data"]
                status_map = {0: '离线', 1: '在线', 2: '故障', 3: '维护中'}
                status_text = status_map.get(device_data["device_status"], '未知状态')
                
                return JSONResponse(
                    status_code=200,
                    content={
                        "success": True,
                        "data": {
                            "device_id": device_data["device_id"],
                            "device_status": device_data["device_status"],
                            "status_text": status_text,
                            "last_update": device_data["update_time"]
                        },
                        "timestamp": datetime.now().isoformat()
                    }
                )
            else:
                return JSONResponse(
                    status_code=404,
                    content={"success": False, "message": f"设备{device_id}不存在", "timestamp": datetime.now().isoformat()}
                )
                
        except Exception as e:
            self.logger.error(f"获取设备状态失败: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"获取设备状态失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )

    async def update_device_status(self, device_request: DeviceInfoRequest):
        """
        POST请求 - 更新设备状态
        """
        try:
            if not device_request.device_id:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供设备编号", "timestamp": datetime.now().isoformat()}
                )
            
            if device_request.device_status is None:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供设备状态", "timestamp": datetime.now().isoformat()}
                )
            
            # 创建更新请求，只更新状态
            update_request = DeviceInfoRequest(
                device_id=device_request.device_id,
                device_status=device_request.device_status,
                updater=device_request.updater
            )
            
            result = await self.update_device_info(update_request)
            return result
            
        except Exception as e:
            self.logger.error(f"更新设备状态失败: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"更新设备状态失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )

if __name__ == '__main__':
    from pathlib import Path
    import asyncio
    
    ROOT_DIRECTORY = Path(__file__).parent.parent.parent.parent
    SQL_CONFIG_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / "sql_config.yaml")
    
    async def main():
        device_server = DeviceInfoServer(sql_config_path=SQL_CONFIG_PATH)
        
        # 测试获取所有设备信息
        response = await device_server.get_device_info()
        print("所有设备信息:", response)
        
        # 测试获取在线设备
        response = await device_server.get_device_info(device_status=1)
        print("在线设备:", response)
    
    asyncio.run(main())