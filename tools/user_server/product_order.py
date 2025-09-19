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
class ProductOrderSchema(BaseModel):
    product_info: str = Field(
        description="预定商品的详细信息！"
    )

@tool
class ProductOrder:
    args_schema: Type[BaseModel] = ProductOrderSchema
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
        product_info: str = None,
        is_ensure: int = 0,
        **kwargs
    ) -> Any:
        if not is_ensure:
            data_list_str = json.dumps([], ensure_ascii=False, indent=2)
            result = f"""<card name="ProductCard" content="搜索到如下山西老陈醋商品：">{data_list_str}</card><confirm content="请确认是否预定？东湖牌山西老陈醋 陈年500ml ¥28.8">请确认是否预定？东湖牌山西老陈醋 陈年500ml ¥28.8 收货人：张秀英  地址：北京市朝阳区建国路88号华贸中心A座2101室</confirm>"""
        else:
            result = f"""已帮您预定商品：东湖牌山西老陈醋 陈年500ml ¥28.8"""
        result = json.dumps(utils.parse_content(result), ensure_ascii=False, indent=2)
        for item in result:
            yield item
        return
