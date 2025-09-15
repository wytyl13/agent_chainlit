#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/04 14:04
@Author  : weiyutao
@File    : client_service.py
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
import json

from agent.base.base_tool import tool
from tools.utils import Utils


utils = Utils()


class ClientServiceSchema(BaseModel):

    type: str = Field(
        description="查询类型: str = <ACTIVITY: 社区活动查询, HEALTH_INFO: 查询健康档案记录情况, HEALTH_STATUS: 查询最近的健康状态或者身体状况>"
    )
    content: str = Field(
        description="查询活动的时间或健康档案记录信息"
    )


@tool
class ClientService:
    args_schema: Type[BaseModel] = ClientServiceSchema
    end_flag: int = 1
    
    
    @overload
    def __init__(
        self, 
    ):
        ...

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
            


    def format_table_data_markdown(self, type, key_mapping, data_list):
        if not data_list:
            return f"暂无{type}信息"
        
        if key_mapping is None:
            key_mapping = {
            'id': 'ID',
            'name': '姓名',
            'age': '年龄', 
            'type': '类型',
            'content': '内容',
            'create_time': '创建时间',
            'update_time': '更新时间',
            'status': '状态',
            'value': '数值',
            'object': '项目',
            'description': '描述'
        }
            
        # 创建表格标题
        markdown_table = f"### 您好！我已为您查询到{type}的信息：\n\n"
        first_dict = data_list[0] if data_list else {}
        available_keys = list(first_dict.keys())
        
        # 创建表头
        headers = [key_mapping.get(key, key) for key in available_keys]
        markdown_table += "| " + " | ".join(headers) + " |\n"
        markdown_table += "|" + "|".join(["-" * len(header) for header in headers]) + "|\n"
        for i, item in enumerate(data_list, 1):
            row_data = []
            for key in available_keys:
                value = item.get(key, '未知')
                # 处理时间格式
                if 'create_time' in key.lower() and isinstance(value, str) and 'T' in value:
                    date_part, time_part = value.split('T')
                    time_part = time_part.split('.')[0] if '.' in time_part else time_part
                    value = f"{date_part} {time_part}"
                value = str(value).replace('|', '\\|').replace('\n', ' ')
                row_data.append(value)
            
            markdown_table += "| " + " | ".join(row_data) + " |\n"
        
        return markdown_table


    async def execute(
        self, 
        type,
        content,
        **kwargs
    ) -> Any:
        
        result = ""
        if type == "ACTIVITY":
            # 课程信息字段映射
            key_mapping = {
                "activity_id": "活动编号",
                "activity_name": "活动名称",
                "activity_type": "活动类型",
                "organizer": "主办方",
                "date": "活动日期",
                "time": "活动时间",
                "location": "活动地点",
                "participants_limit": "参与人数限制",
                "current_participants": "当前报名人数",
                "status": "活动状态",
                "fee": "活动费用",
                "description": "活动描述",
                "contact": "联系方式"
            }


            # 社区活动数据
            data_list = [
                {
                    "activity_id": "AC001",
                    "activity_name": "晨练太极拳",
                    "activity_type": "健身运动",
                    "organizer": "社区文体中心",
                    "date": "2024-12-09",
                    "time": "07:00-08:00",
                    "location": "社区广场",
                    "participants_limit": "不限",
                    "current_participants": "25人",
                    "status": "进行中",
                    "fee": "免费",
                    "description": "每日晨练，强身健体，欢迎新老朋友参加",
                    "contact": "张教练 138****1234"
                },
                {
                    "activity_id": "AC002",
                    "activity_name": "书法交流会",
                    "activity_type": "文化艺术",
                    "organizer": "社区老年大学",
                    "date": "2024-12-10",
                    "time": "14:00-16:00",
                    "location": "活动中心二楼",
                    "participants_limit": "20人",
                    "current_participants": "15人",
                    "status": "可报名",
                    "fee": "免费",
                    "description": "书法爱好者交流切磋，现场指导",
                    "contact": "李老师 139****5678"
                },
                {
                    "activity_id": "AC003",
                    "activity_name": "健康义诊活动",
                    "activity_type": "健康医疗",
                    "organizer": "社区卫生服务中心",
                    "date": "2024-12-11",
                    "time": "09:00-11:30",
                    "location": "社区卫生站",
                    "participants_limit": "50人",
                    "current_participants": "32人",
                    "status": "可报名",
                    "fee": "免费",
                    "description": "免费测血压血糖，健康咨询，常见病预防知识讲座",
                    "contact": "王医生 137****9012"
                },
                {
                    "activity_id": "AC004",
                    "activity_name": "老年手机使用培训",
                    "activity_type": "技能学习",
                    "organizer": "社区志愿者服务队",
                    "date": "2024-12-12",
                    "time": "15:00-16:30",
                    "location": "社区服务大厅",
                    "participants_limit": "15人",
                    "current_participants": "12人",
                    "status": "可报名",
                    "fee": "免费",
                    "description": "教授智能手机基本操作，微信使用，网上购物等",
                    "contact": "小王 135****3456"
                }
            ]
            
            data_list = utils.convert_to_chinese_fields(data_list=data_list, key_mapping=key_mapping)
            

            
            food_data_list = [
                {
                    "dish_id": "001",
                    "dish_name": "宫保鸡丁",
                    "category": "川菜",
                    "price": "¥28",
                    "ingredients": "鸡肉、花生、青椒、红椒",
                    "nutrition": "高蛋白、维生素C",
                    "rating": "4.8",
                    "availability": "有货",
                    "description": "经典川菜，麻辣鲜香，鸡肉嫩滑配花生脆香"
                },
                {
                    "dish_id": "002", 
                    "dish_name": "红烧狮子头",
                    "category": "淮扬菜",
                    "price": "¥35",
                    "ingredients": "猪肉、马蹄、冬菇、青菜",
                    "nutrition": "高蛋白、膳食纤维",
                    "rating": "4.6",
                    "availability": "有货",
                    "description": "淮扬名菜，肉质鲜嫩，汤汁醇厚，营养丰富"
                },
                {
                    "dish_id": "003",
                    "dish_name": "清蒸鲈鱼",
                    "category": "粤菜",
                    "price": "¥42",
                    "ingredients": "新鲜鲈鱼、蒸鱼豉油、葱丝",
                    "nutrition": "高蛋白、低脂肪、DHA",
                    "rating": "4.9",
                    "availability": "缺货",
                    "description": "粤式经典，鱼肉鲜嫩，保持原汁原味"
                }
            ]
            
            
            attendance_data = [
                {
                    "studentId": "ST001",
                    "courseId": "CS001",
                    "studentName": "张大爷",
                    "month": "2024年12月",
                    "stats": [{
                        "present": 15,
                        "late": 2,
                        "absent": 1
                    }],
                    "records": [
                        {
                            "courseName": "太极拳基础班",
                            "date": "2024-12-02",
                            "day": "周一",
                            "time": "08:55",
                            "status": "已签到"
                        },
                        {
                            "courseName": "太极拳基础班",
                            "date": "2024-12-04",
                            "day": "周三", 
                            "time": "09:10",
                            "status": "迟到"
                        },
                        {
                            "courseName": "毛笔书法入门",
                            "date": "2024-12-06",
                            "day": "周五",
                            "time": "13:58",
                            "status": "已签到"
                        },
                        {
                            "courseName": "太极拳基础班",
                            "date": "2025-09-06",
                            "day": "周六",
                            "time": "",
                            "status": "缺勤"
                        }
                    ]
                }
            ]
            data_list_str = json.dumps(data_list, ensure_ascii=False, indent=2)
            food_data_list_str = json.dumps(food_data_list, ensure_ascii=False, indent=2)
            attendance_data_str = json.dumps(attendance_data, ensure_ascii=False, indent=2)
            # result = self.format_table_data_markdown(type=content, key_mapping=key_mapping, data_list=data_list)
            
            
            
            # 测试返回案例
            # 1 标签形式
            # 2 标签中的name属性为对应的react页面或者前端的页面
            # 3 标签中的content属性为搭配卡片、确认、图片、dataframe等格式的首行字符串输出
            # 4 标签包裹的数据一般为图片绝对路径、URL、json数据（需要在页面中展示的）
            
            result = f"""我是谁啊hi额发货IE发色鹅湖黑粉妇委会覅黑粉份额时
            <data_frame content="">{data_list_str}</data_frame><confirm>请确认您的订单？</confirm>
            <image content="张秀英">http://gips3.baidu.com/it/u=3886271102,3123389489&fm=3028&app=3028&f=JPEG&fmt=auto?w=1280&h=960</image>
            <card name="MenuCards" content=f"✅ 成功: 找到 {len(food_data_list_str)}道菜品">{food_data_list_str}</card>
            <card name="AttendanceCard" content="社区活动清单">{attendance_data_str}</card>"""
            
            # 如果和前端对接使用的是标签字符串格式，那么直接返回result即可
            
            try:
                # 如果前端对接的时候要求使用json数据格式返回，这里将上述字符串标签数据格式化为json格式数据返回即可，注意使用json.dumps返回字符串格式的json
                result = json.dumps(utils.parse_content(result), 
                   ensure_ascii=False,  # 支持中文
                   indent=2) 
                print(f"result:---------------------------------------------- {result}")
            except Exception as e:
                raise ValueError(f"Failed to exec parse content!") from e
            
            
        if type == "HEALTH_STATUS":
            result = """
            智能健康分析报告
            根据您最近的健康检查记录分析：
            🟡 总体状况：需要关注
            您的身体状况总体稳定，但有几项指标需要注意。
            ⚠️ 需要关注的指标
            血压

            检查结果： 135/85 mmHg
            健康状态： 轻度高血压
            检查日期： 2024-12-01
            医生建议： 建议低盐饮食，适量运动

            血糖

            检查结果： 6.2 mmol/L
            健康状态： 血糖偏高
            检查日期： 2024-12-01
            医生建议： 注意控制饮食，定期复查

            ✅ 正常指标
            心电图
            💊 当前用药

            降压药： 氨氯地平片 5mg
            用药说明： 每日一次，饭后服用，如有不适及时就医

            📋 健康建议
            血压管理

            继续坚持低盐饮食，适量运动
            定期监测血压变化

            血糖控制

            控制糖分摄入，定期监测血糖
            注意饮食结构调整

            日常保健

            保持规律作息，适度锻炼
            按时服药，定期复查
            如有不适及时就医

            📞 温馨提醒
            请继续关注血压和血糖指标的变化，建议1-2个月后进行复查。如出现头晕、胸闷、乏力等症状，请及时就医咨询。

            """
          
        if type == "HEALTH_INFO":
            # 学员出勤记录数据结构（用于查询出勤情况）
            key_mapping = {
                "record_id": "记录编号",
                "user_id": "用户编号",
                "user_name": "用户姓名",
                "record_date": "记录日期",
                "record_type": "记录类型",
                "examination_item": "检查项目",
                "result": "检查结果",
                "normal_range": "正常范围",
                "status": "健康状态",
                "doctor": "检查医生",
                "hospital": "医疗机构",
                "remarks": "备注说明"
            }

            # 健康档案数据
            data_list = [
                {
                    "record_id": "HR001",
                    "user_id": "U001",
                    "user_name": "李大爷",
                    "record_date": "2024-12-01",
                    "record_type": "常规体检",
                    "examination_item": "血压",
                    "result": "135/85 mmHg",
                    "normal_range": "120/80 mmHg",
                    "status": "轻度高血压",
                    "doctor": "王医生",
                    "hospital": "社区卫生服务中心",
                    "remarks": "建议低盐饮食，适量运动"
                },
                {
                    "record_id": "HR002",
                    "user_id": "U001",
                    "user_name": "李大爷",
                    "record_date": "2024-12-01",
                    "record_type": "常规体检",
                    "examination_item": "血糖",
                    "result": "6.2 mmol/L",
                    "normal_range": "3.9-6.1 mmol/L",
                    "status": "血糖偏高",
                    "doctor": "王医生",
                    "hospital": "社区卫生服务中心",
                    "remarks": "注意控制饮食，定期复查"
                },
                {
                    "record_id": "HR003",
                    "user_id": "U001",
                    "user_name": "李大爷",
                    "record_date": "2024-11-15",
                    "record_type": "专科检查",
                    "examination_item": "心电图",
                    "result": "窦性心律",
                    "normal_range": "正常",
                    "status": "正常",
                    "doctor": "张医生",
                    "hospital": "人民医院",
                    "remarks": "心脏功能正常"
                },
                {
                    "record_id": "HR004",
                    "user_id": "U001", 
                    "user_name": "李大爷",
                    "record_date": "2024-11-10",
                    "record_type": "用药记录",
                    "examination_item": "降压药",
                    "result": "氨氯地平片 5mg",
                    "normal_range": "每日一次",
                    "status": "正在服用",
                    "doctor": "王医生",
                    "hospital": "社区卫生服务中心",
                    "remarks": "饭后服用，如有不适及时就医"
                }
            ]

            result = self.format_table_data_markdown(type=content, key_mapping=key_mapping, data_list=data_list)
        
        for item in result:
            yield item
        return
    