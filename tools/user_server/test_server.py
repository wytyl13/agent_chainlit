#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/04 14:04
@Author  : weiyutao
@File    : test.py
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



utils = Utils()
class TestSchema(BaseModel):
    operation: str = Field(
        description="测试数据"
    )


@tool
class Test:
    args_schema: Type[BaseModel] = TestSchema
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
        **kwargs
    ) -> Any:
        data_list_str = json.dumps([], ensure_ascii=False, indent=2)
        result = f"""<card name="InteractiveWindow" content="来新订单啦！">{data_list_str}</card>"""
        result = json.dumps(utils.parse_content(result), ensure_ascii=False, indent=2)
        for item in result:
            yield item
        return
