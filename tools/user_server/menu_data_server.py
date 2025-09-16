#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/04 14:04
@Author  : weiyutao
@File    : online_market.py
"""
from typing import (
    Optional,
    Dict,
    Any,
    List,
    overload,
    Type
)

from pydantic import Field, BaseModel
import re
import uuid
import json
from datetime import datetime, timedelta

from agent.base.base_tool import tool
from tools.utils import Utils
from api.server.menu_server import MenuDataServer
from api.server.menu_server import ListMenuData

SOURCE_STORAGE_PATH = "/work/ai/agent_chainlit/api/source"
SOURCE_API_PREFIX = "https://ai.shunxikj.com:8890/api/files/download"
URL_PREFIX = "https://192.168.0.17:8890"

menu_data_server = MenuDataServer(sql_config_path="/work/ai/agent_chainlit/config/yaml/sql_config.yaml")

utils = Utils()
class MenuServiceSchema(BaseModel):
    operation: str = Field(
        description="根据上下文历史会话消息提取菜单操作类型: str = <LIST: 查看, ADD: 新增, UPDATE: 修改, DELETE: 删除>"
    )
    dish_name: str = Field(
        default=None,
        description="查询的菜品名称，提取不到赋值为空白字符串，严格按照上下文，不要臆想"
    )
    price: int = Field(
        default=None,
        description="菜品价格，提取不到赋值为0，严格按照上下文，不要臆想"
    )

@tool
class MenuService:
    args_schema: Type[BaseModel] = MenuServiceSchema
    end_flag: int = 1
    
    @overload
    def __init__(
        self, 
    ):
        ...


    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        

    
    async def execute(
        self, 
        operation: str = None,
        dish_name: Optional[str] = None,
        price: Optional[int] = None,
        **kwargs
    ) -> Any:
        result = ""
        print(f"operation: ----------------------- {operation}")
        if operation is None or operation not in ["LIST", "ADD", "UPDATE", "DELETE"]:
            result = "请告诉我具体的操作类型：比如我要查看菜单信息！"
        if operation == "LIST":
            # param_dict = {}
            # if dish_name:
            #     param_dict["dish_name"] = dish_name
            # result = utils.request_url(
            #     url=f"{URL_PREFIX}/api/menu_data",
            #     param_dict=param_dict,
            # )
            menu_data = ListMenuData(dish_name=dish_name)
            if dish_name == "" or dish_name is None:
                menu_data = ListMenuData()
            response = await menu_data_server.post_menu_data(menu_data)
            result = utils.parse_server_return(response=response)
            if not result:
                result = "您还没有上传菜单信息！您可以告诉我添加菜品信息（菜品名称、价格、菜品描述等）"
            else:
                dish_name = [item["dish_name"] for item in result]
                dish_name_str = '、'.join(dish_name)
                # 商品信息字段映射
                # 今日菜单数据
                data_list_str = json.dumps(result, ensure_ascii=False, indent=2)
                result = f"""
                <card name="MenuCards" content="为您查到{len(result)}条菜品信息：{dish_name_str}，菜品详细信息如下：">{data_list_str}</card>
                """
        if operation == "ADD":
            menu_data = ListMenuData(dish_name=dish_name, price=price)
            response = await menu_data_server.save_menu_data(menu_data)
            if hasattr(response, 'body'):
                content = json.loads(response.body.decode())
                result = content.get("message", "菜品：{dish_name}新增失败！")
        
        if operation == "UPDATE":
            menu_data = ListMenuData(dish_name=dish_name, price=price)
            response = await menu_data_server.update_menu_data(menu_data)
            if hasattr(response, 'body'):
                content = json.loads(response.body.decode())
                result = content.get("message", f"菜品：{dish_name}更新成功！")
                
        if operation == "DELETE":
            menu_data = ListMenuData(dish_name=dish_name, price=price)
            response = await menu_data_server.delete_menu_data(menu_data)
            if hasattr(response, 'body'):
                content = json.loads(response.body.decode())
                result = content.get("message", f"菜品：{dish_name}删除成功！")
        
        result = json.dumps(utils.parse_content(result), ensure_ascii=False, indent=2)
        for item in result:
            yield item
        return
