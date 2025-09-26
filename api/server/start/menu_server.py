#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/08/06 11:22
@Author  : weiyutao
@File    : user_data_server.py
"""


from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
import logging
from pydantic import BaseModel
from typing import (
    Optional
)
from fastapi.encoders import jsonable_encoder
import asyncio
import requests
from urllib.parse import urlparse
import os
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
import time

from api.table.base.user_data import UserData
from agent.provider.sql_provider import SqlProvider
from api.table.start.menu_data import MenuData
from tools.utils import Utils

utils = Utils()


class ListMenuData(BaseModel):
    dish_name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[int] = None
    ingredients: Optional[str] = None
    nutrition: Optional[str] = None
    rating: Optional[float] = None
    description: Optional[str] = None
    url: Optional[str] = None
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class MenuDataServer:
    """用户服务类"""
    
    def __init__(self, sql_config_path: str):
        self.sql_config_path = sql_config_path
        self.logger = logging.getLogger(self.__class__.__name__)
        self.sql_provider = SqlProvider(model=MenuData, sql_config_path=self.sql_config_path)
    
    def register_routes(self, app: FastAPI):
        """注册用户相关的路由"""
        app.get("/api/menu_data")(self.get_menu_data)
        app.post("/api/menu_data")(self.post_menu_data)
        app.post("/api/menu_data/save")(self.save_menu_data)
        app.post("/api/menu_data/update")(self.update_menu_data)
        app.post("/api/menu_data/delete")(self.delete_menu_data)
    
    
    async def get_menu_data(
        self,
        dish_name: Optional[str] = None,
    ):
        """
        GET请求 - 支持获取所有用户（不传递任何参数）信息，支持获取指定用户（在url中传递username参数）信息
        Examples:
        - GET /api/user_data -> 获取所有用户信息
        - GET /api/user_data?username=john -> 获取john用户的设备信息
        """
        condition = {}
        if dish_name is not None:
            condition["dish_name"] = dish_name
        sql_provider = None
        try:
            sql_provider = SqlProvider(model=MenuData, sql_config_path=self.sql_config_path)
            print(sql_provider)
            result = await sql_provider.get_record_by_condition(
                condition=condition,
                # fields=["id", "username", "password", "full_name", "gender", "age", "address", "phone", "email", "status", "create_time", "tenant_id", "role", "community"]
            )
            json_compatible_result = jsonable_encoder(result)
            
            return JSONResponse(
                status_code=200,
                content={"success": True, "data": json_compatible_result, "timestamp": datetime.now().isoformat()}
            )
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"获取菜单数据失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
        finally:
            if sql_provider:
                await sql_provider.close()
                # 等待一小段时间确保连接完全关闭
                await asyncio.sleep(0.1)


    async def post_menu_data(
        self,
        list_menu_data: ListMenuData,
    ):
        """
        POST请求 - 支持获取所有用户（使用JSON空白请求体）信息，支持获取指定用户（在JSON请求体中传递username参数）信息
        Examples:
        - POST /api/user_data {} -> 获取所有用户信息
        - POST /api/user_data {"username": "JOHN"} -> 获取JOHN用户的设备信息
        """
        # 无效代码-----------------------------------------------------------------------------------------
        print(f"list_menu_data: ---------------------------------------- {list_menu_data}")
        try:
            dish_name = list_menu_data.dish_name
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": f"传参错误！{str(e)}", "data": None, "timestamp": datetime.now().isoformat()}
            )
        # 无效代码-----------------------------------------------------------------------------------------
        try:
            result = await self.get_menu_data(dish_name)
            return result
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"获取用户数据失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
    
    
    def search_images(self, query, filename=None, save_path="/work/ai/WHOAMI/whoami/out/news_generate"):
        """
        优化的图片搜索和下载函数 - 简化版本避免版本兼容问题
        """
        url = "https://www.googleapis.com/customsearch/v1"              
        params = {             
            'q': query,
            'cx': "169ae7f2f9875403d",
            'key': "AIzaSyDE4GtUjV5AaRaCsY4dyM2ZvuxEkkG308Q",
            'searchType': 'image',
            'num': 5,
            'safe': 'active',
            'imgSize': 'medium',
        }              
        
        print(f"搜索参数: {params}")
        
        # 创建简单的session，避免复杂的重试配置
        session = requests.Session()
        
        try:             
            # 搜索图片
            response = session.get(url, params=params, timeout=30)             
            response.raise_for_status()
            data = response.json()             
            
            print(f"搜索结果: 找到 {len(data.get('items', []))} 张图片")
            
            if 'items' not in data or len(data['items']) == 0:                 
                return {'success': False, 'error': '没有找到相关图片'}              
            
            # 创建保存目录
            os.makedirs(save_path, exist_ok=True)
            
            # 尝试多个结果，直到找到一个可用的
            download_errors = []
            
            for i, image_item in enumerate(data['items']):
                image_url = image_item['link']             
                image_title = image_item.get('title', query)
                
                print(f"尝试下载第 {i+1} 张图片: {image_url}")
                
                # 简单验证URL格式
                if not image_url.startswith(('http://', 'https://')):
                    download_errors.append(f"URL格式无效: {image_url}")
                    continue
                
                # 手动重试机制，避免使用urllib3的Retry类
                max_retries = 3
                retry_count = 0
                
                while retry_count < max_retries:
                    try:
                        # 增强的请求头
                        headers = {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'DNT': '1',
                            'Connection': 'keep-alive',
                            'Upgrade-Insecure-Requests': '1',
                            'Referer': 'https://www.google.com/',
                        }
                        
                        # 尝试获取图片
                        img_response = session.get(
                            image_url, 
                            timeout=(15, 30),  # 连接超时15秒，读取超时30秒
                            headers=headers,
                            stream=True,  # 使用流式下载
                            verify=False,  # 禁用SSL验证以避免SSL错误
                            allow_redirects=True
                        )
                        img_response.raise_for_status()
                        
                        # 检查内容类型
                        content_type = img_response.headers.get('content-type', '').lower()
                        if not any(img_type in content_type for img_type in ['image/', 'jpeg', 'jpg', 'png', 'webp']):
                            download_errors.append(f"不是图片文件: {content_type}")
                            break  # 不是图片，不需要重试
                        
                        # 检查内容长度
                        content_length = img_response.headers.get('content-length')
                        if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB限制
                            download_errors.append(f"文件太大: {int(content_length)/1024/1024:.1f}MB")
                            break  # 文件太大，不需要重试
                        
                        # 生成文件名
                        if filename is None:                 
                            parsed_url = urlparse(image_url)                 
                            ext = os.path.splitext(parsed_url.path)[1].lower()
                            
                            # 如果没有扩展名，从content-type推断
                            if not ext or ext not in ['.jpg', '.jpeg', '.png', '.webp', '.gif']:
                                if 'jpeg' in content_type or 'jpg' in content_type:
                                    ext = '.jpg'
                                elif 'png' in content_type:
                                    ext = '.png'
                                elif 'webp' in content_type:
                                    ext = '.webp'
                                elif 'gif' in content_type:
                                    ext = '.gif'
                                else:
                                    ext = '.jpg'  # 默认
                            
                            # 清理标题作为文件名
                            safe_title = "".join(c for c in image_title if c.isalnum() or c in (' ', '-', '_')).strip()                 
                            if not safe_title:                     
                                safe_title = query
                            
                            # 限制文件名长度并添加索引
                            filename = f"{safe_title[:30]}_img{i+1}{ext}"
                            filename = self.sanitize_filename(filename)      
                        else:
                            filename = self.sanitize_filename(filename)
                        
                        full_path = os.path.join(save_path, filename)
                        
                        # 如果文件已存在，添加时间戳
                        if os.path.exists(full_path):
                            name, ext = os.path.splitext(filename)
                            timestamp = int(time.time())
                            filename = f"{name}_{timestamp}{ext}"
                            full_path = os.path.join(save_path, filename)
                        
                        # 下载并保存文件
                        total_size = 0
                        max_size = 10 * 1024 * 1024  # 10MB
                        
                        with open(full_path, 'wb') as f:
                            for chunk in img_response.iter_content(chunk_size=8192):
                                if chunk:
                                    f.write(chunk)
                                    total_size += len(chunk)
                                    # 检查大小限制
                                    if total_size > max_size:
                                        f.close()
                                        os.remove(full_path)
                                        raise Exception(f"文件太大: {total_size/1024/1024:.1f}MB")
                        
                        # 验证文件是否成功保存
                        if os.path.exists(full_path) and os.path.getsize(full_path) > 0:
                            self.logger.info(f"图片下载成功: {full_path} ({total_size/1024:.1f}KB)")
                            return {                 
                                'success': True,                 
                                'file_path': full_path,                 
                                'filename': filename,                 
                                'image_url': image_url,                 
                                'title': image_title,                 
                                'size': total_size,
                                'content_type': content_type
                            }
                        else:
                            download_errors.append(f"文件保存失败或为空")
                            break  # 文件保存问题，不需要重试
                            
                    except requests.exceptions.Timeout:
                        retry_count += 1
                        if retry_count >= max_retries:
                            download_errors.append(f"下载超时 (已重试{max_retries}次): {image_url}")
                        else:
                            print(f"下载超时，正在重试 ({retry_count}/{max_retries})")
                            time.sleep(1)
                        continue
                        
                    except requests.exceptions.ConnectionError as e:
                        retry_count += 1
                        if retry_count >= max_retries:
                            download_errors.append(f"连接错误 (已重试{max_retries}次): {str(e)}")
                        else:
                            print(f"连接错误，正在重试 ({retry_count}/{max_retries})")
                            time.sleep(1)
                        continue
                        
                    except requests.exceptions.HTTPError as e:
                        if e.response.status_code in [429, 500, 502, 503, 504]:
                            retry_count += 1
                            if retry_count >= max_retries:
                                download_errors.append(f"HTTP错误 {e.response.status_code} (已重试{max_retries}次): {image_url}")
                            else:
                                print(f"HTTP错误 {e.response.status_code}，正在重试 ({retry_count}/{max_retries})")
                                time.sleep(2)
                            continue
                        else:
                            download_errors.append(f"HTTP错误 {e.response.status_code}: {image_url}")
                            break  # 客户端错误，不需要重试
                            
                    except Exception as e:
                        download_errors.append(f"下载失败: {str(e)}")
                        break  # 其他错误，不需要重试
                
                # 添加延迟避免被限制
                time.sleep(0.5)
            
            # 所有图片都失败了
            error_summary = "; ".join(download_errors[:3])  # 只显示前3个错误
            return {
                'success': False, 
                'error': f'所有图片下载都失败了。错误示例: {error_summary}',
                'all_errors': download_errors
            }
            
        except requests.exceptions.RequestException as e:             
            return {'success': False, 'error': f'搜索请求错误: {str(e)}'}         
        except Exception as e:             
            return {'success': False, 'error': f'未知错误: {str(e)}'}


    # 如果你还没有sanitize_filename方法，这里是一个实现
    def sanitize_filename_(self, filename):
        """清理文件名，移除非法字符"""
        import re
        # 移除或替换非法字符
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        # 移除控制字符
        filename = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', filename)
        # 限制长度
        if len(filename) > 255:
            name, ext = os.path.splitext(filename)
            filename = name[:255-len(ext)] + ext
        return filename.strip()
    
    
    def sanitize_filename(self, filename):
        import re
        import os
        import hashlib
        
        # 分离文件名和扩展名
        name, ext = os.path.splitext(filename)
        
        # 如果文件名太复杂，使用hash + 时间戳
        if (len(name) > 50 or 
            re.search(r'[\u4e00-\u9fff]', name) or  # 包含中文
            len(re.sub(r'[a-zA-Z0-9_\-]', '', name)) > 5):  # 特殊字符太多
            
            # 生成简短的hash
            hash_short = hashlib.md5(name.encode()).hexdigest()[:8]
            import time
            timestamp = int(time.time())
            name = f"dish_{hash_short}_{timestamp}"
        else:
            # 简单清理
            name = re.sub(r'[^\w\-]', '_', name)
            name = re.sub(r'_+', '_', name)
        
        filename = name + ext
        return filename.strip('_.')
    
    
    async def save_menu_data(
        self,
        list_menu_data: ListMenuData,
    ):
        """
        POST请求 - 支持获取所有用户（使用JSON空白请求体）信息，支持获取指定用户（在JSON请求体中传递username参数）信息
        Examples:
        - POST /api/user_data {} -> 获取所有用户信息
        - POST /api/user_data {"username": "JOHN"} -> 获取JOHN用户的设备信息
        """
        try:
            self.logger.info(f"收到社区数据保存请求: {list_menu_data}")
            print(f"list_menu_data: --------------------------------- {list_menu_data}")
            if not list_menu_data.dish_name:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供菜品名称", "timestamp": datetime.now().isoformat()}
                )
            
            # if not list_menu_data.category:
            #     return JSONResponse(
            #         status_code=400,
            #         content={"success": False, "message": "请提供菜品类别", "timestamp": datetime.now().isoformat()}
            #     )
            menu_data = ListMenuData(dish_name=list_menu_data.dish_name)
            response = await self.post_menu_data(menu_data)
            response = utils.parse_server_return(response)
            if response:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": f"""<confirm content="确认修改菜品：{list_menu_data.dish_name}">菜品{list_menu_data.dish_name}已经存在，请问您是否要修改？</confirm>""", "timestamp": datetime.now().isoformat()}
                )
            
            if not list_menu_data.price or list_menu_data.price == 0:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供菜品价格", "timestamp": datetime.now().isoformat()}
                )
            
            insert_data = {
                "dish_name": list_menu_data.dish_name,
                "price": list_menu_data.price,
                "create_time": datetime.now(),
                "update_time": datetime.now()
            }
            if hasattr(list_menu_data, 'ingredients') and list_menu_data.ingredients:
                insert_data["ingredients"] = list_menu_data.ingredients
            else:
                insert_data["ingredients"] = "营养健康"
                
            if hasattr(list_menu_data, 'category') and list_menu_data.category:
                insert_data["category"] = list_menu_data.category
            else:
                insert_data["category"] = "家常菜"
                
            if hasattr(list_menu_data, 'nutrition') and list_menu_data.nutrition:
                insert_data["nutrition"] = list_menu_data.nutrition
            else:
                insert_data["nutrition"] = "营养健康"
                
            if hasattr(list_menu_data, 'rating') and list_menu_data.rating is not None:
                insert_data["rating"] = list_menu_data.rating
            else:
                insert_data["nutrition"] = "4.8"
                
            if hasattr(list_menu_data, 'description') and list_menu_data.description:
                insert_data["description"] = list_menu_data.description
            else:
                insert_data["nutrition"] = "营养健康"
            
            if hasattr(list_menu_data, 'url') and list_menu_data.url:
                insert_data["url"] = list_menu_data.url
            else:
                result = self.search_images(query=list_menu_data.dish_name, save_path="/work/ai/agent_chainlit/api/source")
                url = ""
                print(f"result: ------------------------ {result}")
                print(f"result: ------------------------ {result}")
                if result["success"]:
                    file_name = result["filename"]
                    url = f"https://ai.shunxikj.com:8890/api/files/download/{file_name}"
                insert_data["url"] = url
                
            result = await self.sql_provider.add_record(insert_data)
            print("result: ------------------------------------------------ {result}")
            if result:
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": "保存成功", "data": str(result), "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": "数据库添加记录失败", "timestamp": datetime.now().isoformat()}
                )
                
        except Exception as e:
            self.logger.error(f"保存社区数据失败: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"保存失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
            
            
    async def update_menu_data(
        self,
        list_menu_data: ListMenuData,
    ):
        """
        POST请求 - 支持获取所有用户（使用JSON空白请求体）信息，支持获取指定用户（在JSON请求体中传递username参数）信息
        Examples:
        - POST /api/user_data {} -> 获取所有用户信息
        - POST /api/user_data {"username": "JOHN"} -> 获取JOHN用户的设备信息
        """
        try:
            self.logger.info(f"收到社区数据保存请求: {list_menu_data}")
            print(f"list_menu_data: --------------------------------- {list_menu_data}")
            if not list_menu_data.dish_name:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供菜品名称", "timestamp": datetime.now().isoformat()}
                )
            
            menu_data = ListMenuData(dish_name=list_menu_data.dish_name)
            response = await self.post_menu_data(menu_data)
            import json
            if hasattr(response, 'body'):
                response = json.loads(response.body.decode())
            if response.get("success"):
                response = response.get("data", [])
                print(f"查询到 {len(response)} 条菜品记录")
            else:
                response = []
                print(f"查询失败: {response.get('message')}")
            
            insert_data = {}
            
            
            if not list_menu_data.price or list_menu_data.price == 0:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供菜品价格", "timestamp": datetime.now().isoformat()}
                )
                
            if response:
                insert_data["dish_name"] = list_menu_data.dish_name
                insert_data["price"] = list_menu_data.price
                insert_data["update_time"] = datetime.now()
            response = response[0]
            
            print(f"response: -------------------------------------------------- {response}")
            if hasattr(list_menu_data, 'ingredients') and list_menu_data.ingredients:
                insert_data["ingredients"] = list_menu_data.ingredients
            else:
                insert_data["ingredients"] = response["ingredients"]
                
            if hasattr(list_menu_data, 'category') and list_menu_data.category:
                insert_data["category"] = list_menu_data.category
            else:
                insert_data["category"] = response["category"]
                
            if hasattr(list_menu_data, 'nutrition') and list_menu_data.nutrition:
                insert_data["nutrition"] = list_menu_data.nutrition
            else:
                insert_data["nutrition"] = response["nutrition"]
                
            if hasattr(list_menu_data, 'rating') and list_menu_data.rating is not None:
                insert_data["rating"] = list_menu_data.rating
            else:
                insert_data["nutrition"] = response["nutrition"]
                
            if hasattr(list_menu_data, 'description') and list_menu_data.description:
                insert_data["description"] = list_menu_data.description
            else:
                insert_data["description"] = response["description"]
            
            if hasattr(list_menu_data, 'url') and list_menu_data.url:
                insert_data["url"] = list_menu_data.url
            else:
                if response["url"]:
                    insert_data["url"] = response["url"]
                else:
                    result = self.search_images(query=list_menu_data.dish_name, save_path="/work/ai/agent_chainlit/api/source")
                    url = ""
                    print(f"result: ------------------------ {result}")
                    print(f"result: ------------------------ {result}")
                    if result["success"]:
                        file_name = result["filename"]
                        url = f"https://ai.shunxikj.com:8890/api/files/download/{file_name}"
                    insert_data["url"] = url
            print(f"insert_data: -------------------------------- {insert_data}")
            print(f"insert_data: -------------------------------- {insert_data}")
            delete_result = await self.sql_provider.delete_record(record_id=response["id"], hard_delete=True)
            result = await self.sql_provider.add_record(insert_data)
            print("result: ------------------------------------------------ {result}")
            if result:
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": "保存成功", "data": str(result), "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": "数据库添加记录失败", "timestamp": datetime.now().isoformat()}
                )
                
        except Exception as e:
            import traceback
            self.logger.error(f"保存社区数据失败: {str(e)}\n{traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"保存失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
            
            
    async def delete_menu_data(
        self,
        list_menu_data: ListMenuData,
    ):
        """
        POST请求 - 支持获取所有用户（使用JSON空白请求体）信息，支持获取指定用户（在JSON请求体中传递username参数）信息
        Examples:
        - POST /api/user_data {} -> 获取所有用户信息
        - POST /api/user_data {"username": "JOHN"} -> 获取JOHN用户的设备信息
        """
        try:
            self.logger.info(f"收到社区数据保存请求: {list_menu_data}")
            print(f"list_menu_data: --------------------------------- {list_menu_data}")
            if not list_menu_data.dish_name:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供要删除的菜品名称", "timestamp": datetime.now().isoformat()}
                )
            
            menu_data = ListMenuData(dish_name=list_menu_data.dish_name)
            response = await self.post_menu_data(menu_data)
            import json
            if hasattr(response, 'body'):
                response = json.loads(response.body.decode())
            if response.get("success"):
                response = response.get("data", [])
                print(f"查询到 {len(response)} 条菜品记录")
            else:
                response = []
                print(f"查询失败: {response.get('message')}")
            
            insert_data = {}
            
                
            if response:
                response = response[0]
                delete_result = await self.sql_provider.delete_record(record_id=response["id"], hard_delete=True)
                result = f"菜品{list_menu_data.dish_name}删除成功"
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": f"菜品{list_menu_data.dish_name}删除成功", "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": f"删除失败！菜品{list_menu_data.dish_name}不存在", "timestamp": datetime.now().isoformat()}
                )
                
        except Exception as e:
            import traceback
            self.logger.error(f"删除菜品失败: {str(e)}\n{traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"删除菜品失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )


if __name__ == '__main__':
    from pathlib import Path
    import asyncio
    ROOT_DIRECTORY = Path(__file__).parent.parent.parent.parent
    SQL_CONFIG_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / "sql_config.yaml")
    import json
    async def main():
        menu_server = MenuDataServer(sql_config_path=SQL_CONFIG_PATH)
        response = await menu_server.get_menu_data()
        print(response)
        # print(json.dumps(response, indent=2, ensure_ascii=False))
        # if response.status_code == 200:
        #     result = response.json()
        #     if result.get("success"):
        #         print(result)
        
    asyncio.run(main())
    