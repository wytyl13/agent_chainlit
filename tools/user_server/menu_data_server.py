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
from api.server.start.menu_server import MenuDataServer
from api.server.start.menu_server import ListMenuData


SOURCE_STORAGE_PATH = "/work/ai/agent_chainlit/api/source"
SOURCE_API_PREFIX = "https://ai.shunxikj.com:8890/api/files/download"
URL_PREFIX = "https://ai.shunxikj.com:9001"

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
            param_dict = {}
            if dish_name:
                param_dict["dish_name"] = dish_name
            result = utils.request_url(
                url=f"{URL_PREFIX}/api/menu_data",
                param_dict=param_dict,
            )
            if not result:
                result = "您还没有上传菜单信息！您可以告诉我添加菜品信息（菜品名称、价格、菜品描述等）"
            else:
                dish_name_list = [item["dish_name"] for item in result]
                dish_name_str = '、'.join(dish_name_list)
                # 商品信息字段映射
                # 今日菜单数据
                request_url_data_dict = {
                    "url": f"{URL_PREFIX}/api/menu_data",
                    "param_dict": {},
                    "method": "POST"
                }
                
                if dish_name:
                    request_url_data_dict["param_dict"] = {
                        "dish_name": dish_name
                    }
                data_list_str = json.dumps(request_url_data_dict, ensure_ascii=False, indent=2)

                result = f"""
                <card name="MenuCards" content="为您查到{len(result)}条菜品信息：{dish_name_str}，菜品详细信息如下：">{data_list_str}</card>
                """
        if operation == "ADD":
            menu_data = ListMenuData(dish_name=dish_name, price=price)
            response = await menu_data_server.save_menu_data(menu_data)
            if hasattr(response, 'body'):
                content = json.loads(response.body.decode())
                result = content.get("message", "菜品：{dish_name}新增失败！")
            response = await menu_data_server.post_menu_data(ListMenuData())
            try:
                response = utils.parse_server_return(response=response)
                data_list_str = json.dumps(response, ensure_ascii=False, indent=2)
                result = result + f"""<card name="MenuCards" content="最新的菜品信息如下：">{data_list_str}</card>"""
            except Exception as e:
                import traceback
                raise ValueError(f"fail to exec UPDATE\n{traceback.format_exc()}") from e

        if operation == "UPDATE":
            menu_data = ListMenuData(dish_name=dish_name, price=price)
            response = await menu_data_server.update_menu_data(menu_data)
            if hasattr(response, 'body'):
                content = json.loads(response.body.decode())
                result = content.get("message", f"菜品：{dish_name}更新成功！")
                response = await menu_data_server.post_menu_data(ListMenuData(dish_name=dish_name))
                try:
                    response = utils.parse_server_return(response=response)
                    data_list_str = json.dumps(response, ensure_ascii=False, indent=2)
                except Exception as e:
                    import traceback
                    raise ValueError(f"fail to exec UPDATE\n{traceback.format_exc()}") from e
                result = result + f"""<card name="MenuCards" content="最新的菜品：{dish_name}信息如下：">{data_list_str}</card>"""

        if operation == "DELETE":
            menu_data = ListMenuData(dish_name=dish_name, price=price)
            response = await menu_data_server.delete_menu_data(menu_data)
            if hasattr(response, 'body'):
                content = json.loads(response.body.decode())
                result = content.get("message", f"菜品：{dish_name}删除成功！")
            response = await menu_data_server.post_menu_data(ListMenuData())
            try:
                response = utils.parse_server_return(response=response)
                data_list_str = json.dumps(response, ensure_ascii=False, indent=2)
                result = result + f"""<card name="MenuCards" content="最新的菜品信息如下：">{data_list_str}</card>"""
            except Exception as e:
                import traceback
                raise ValueError(f"fail to exec UPDATE\n{traceback.format_exc()}") from e
        result = json.dumps(utils.parse_content(result), ensure_ascii=False, indent=2)
        for item in result:
            yield item
        return
