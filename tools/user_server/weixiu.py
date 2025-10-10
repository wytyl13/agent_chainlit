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
from api.server.meal_assistance_subsystem.menu_server import MenuDataServer
from api.server.meal_assistance_subsystem.menu_server import ListMenuData



utils = Utils()
class WeiXiuSchema(BaseModel):
    weixiu_info: str = Field(
        description="维修信息"
    )

@tool
class WeiXiu:
    args_schema: Type[BaseModel] = WeiXiuSchema
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
        weixiu_info: str = None,
        is_ensure: int = 0,
        **kwargs
    ) -> Any:
        if not is_ensure:
            data_list_str = json.dumps([], ensure_ascii=False, indent=2)
            result = f"""<card name="WeiXiuCard" content="已经帮您生成一份维修工单，请查看：">{data_list_str}</card><confirm content="请确认是否提交维修工单？您也可以联系维修人员进行咨询！">请确认您的维修工单！</confirm>"""
        else:
            result = f"""已帮您提交维修工单！维修人员会在1小时内上门服务！"""
        result = json.dumps(utils.parse_content(result), ensure_ascii=False, indent=2)
        for item in result:
            yield item
        return
