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
class HealthReportSchema(BaseModel):
    operation: str = Field(
        description="睡眠情况输出！"
    )


@tool
class HealthReport:
    args_schema: Type[BaseModel] = HealthReportSchema
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
        is_ensure: int = 0,
        **kwargs
    ) -> Any:
        if not is_ensure:
            data_list_str = json.dumps([], ensure_ascii=False, indent=2)
            result = f"""<card name="HealthReport" content="收到您对睡眠情况的困惑，我已经帮您生成一份详细的睡眠报告，请查看！">{data_list_str}</card><confirm>检测到您深度睡眠较少，建议中午适当休息，需要帮您预约下午的中医调理吗？</confirm>"""
        else:
            result = f"""已经帮您预约下午的中医调理，地址：社区卫生室，联系人：张医生，电话：130****8552"""
        result = json.dumps(utils.parse_content(result), ensure_ascii=False, indent=2)
        for item in result:
            yield item
        return
