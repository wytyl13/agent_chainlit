#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/15 16:09
@Author  : wsy
@File    : service_object.py
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


from agent.base.base_tool import tool




class ServiceObjectSchema(BaseModel):
    pass

@tool
class ServiceObject:
    args_schema: Type[BaseModel] = ServiceObjectSchema
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
        **kwargs
    ) -> Any:

        result = f"""<card name="ServiceObject" content="服务对象展示">{[{}]}</card>"""
        for item in result:
            yield item
        return

