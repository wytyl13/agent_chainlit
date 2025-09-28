# #!/usr/bin/env python
# # -*- coding: utf-8 -*-
# """
# @Time    : 2025/09/04 14:04
# @Author  : weiyutao
# @File    : test.py
# """
# from typing import (
#     Optional,
#     Dict,
#     Any,
#     List,
#     overload,
#     Type
# )

# from pydantic import Field, BaseModel
# import re
# import uuid
# import json
# from datetime import datetime, timedelta

# from agent.base.base_tool import tool
# from tools.utils import Utils
# from api.server.start.menu_server import MenuDataServer
# from api.server.start.menu_server import ListMenuData



# utils = Utils()
# class EarlyWarningEventSchema(BaseModel):
#     device_type: str = Field(
#         description="设备类型：从以下三种设备中选择，<睡眠监测仪, 智能床垫, 指夹脉搏监测仪>"
#     )
#     operation: str = Field(
#         description="操作类型：从以下两种操作类型中选择，<回顾预警事件切片, 处理预警事件>"
#     )


# @tool
# class EarlyWarningEvent:
#     args_schema: Type[BaseModel] = EarlyWarningEventSchema
#     end_flag: int = 1
    
#     @overload
#     def __init__(
#         self, 
#     ):
#         ...


#     def __init__(self, **kwargs):
#         super().__init__(**kwargs)


#     async def execute(
#         self, 
#         device_type: str = None,
#         operation: str = None,
#         **kwargs
#     ) -> Any:
#         result_dict = {
#             "user_name": "张秀英",
#             "user_id": "P202309002", 
#             "room": "样板间靠窗床位",
#             "manager": "李时珍",
#             "device_id": "UART__TOPIC_SX_SLEEP_HEART_RATE_LG_02_ODATA"
#         }
#         result_dict_str = json.dumps(result_dict, ensure_ascii=False, indent=2)
#         result = f"""<card name="RealTimeVitalAnalyzeDynamic" content="患者监测系统已启动！">{result_dict_str}</card>"""
#         result = json.dumps(utils.parse_content(result), ensure_ascii=False, indent=2)
#         for item in result:
#             yield item
#         return
