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
from api.server.menu_server import MenuDataServer
from api.server.menu_server import ListMenuData



utils = Utils()
class GraphServerSchema(BaseModel):
    graph_info: str = Field(
        description="绘画信息"
    )

@tool
class GraphServer:
    args_schema: Type[BaseModel] = GraphServerSchema
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
        graph_info: str = None,
        is_ensure: int = 0,
        **kwargs
    ) -> Any:
        if not is_ensure:
            data_list_str = json.dumps([], ensure_ascii=False, indent=2)
            result = f"""<card name="Graph" content="帮您查到一个绘画课程，请查看：">{data_list_str}</card><confirm content="请确认是否帮您报名：夕阳红水彩花卉绘画班？您也可以联系课程管理人员进行咨询！">请确认您是否报名：夕阳红水彩花卉绘画班？</confirm>"""
        else:
            result = f"""已帮您报名夕阳红水彩花卉绘画班！"""
        result = json.dumps(utils.parse_content(result), ensure_ascii=False, indent=2)
        for item in result:
            yield item
        return
