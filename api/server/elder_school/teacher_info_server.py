from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime, date
import logging
from pydantic import BaseModel, validator
from typing import Optional
from fastapi.encoders import jsonable_encoder
import asyncio
import requests
from urllib.parse import urlparse
import os
import time

from api.table.elder_school.teacher_info_manage_data import TeacherInfoManageData
from agent.provider.sql_provider import SqlProvider
from tools.utils import Utils
 
utils = Utils()


class TeacherInfoRequest(BaseModel):
    teacher_code: Optional[str] = None
    teacher_name: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    specialty: Optional[str] = None
    education_background: Optional[str] = None
    hire_date: Optional[str] = None
    status: Optional[str] = None
    avatar_url: Optional[str] = None
    
    @validator('gender')
    def validate_gender(cls, v):
        if v is not None and v not in ['男', '女']:
            raise ValueError('性别只能是"男"或"女"')
        return v
    
    @validator('status')
    def validate_status(cls, v):
        if v is not None and v not in ['在职', '休假', '离职']:
            raise ValueError('状态只能是"在职"、"休假"或"离职"')
        return v
    
    @validator('birth_date', 'hire_date')
    def validate_date_format(cls, v):
        if v is not None:
            try:
                datetime.strptime(v, '%Y-%m-%d')
            except ValueError:
                raise ValueError('日期格式应为YYYY-MM-DD')
        return v


import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class TeacherInfoServer:
    """教师信息管理服务类"""
    
    def __init__(self, sql_config_path: str):
        self.sql_config_path = sql_config_path
        self.logger = logging.getLogger(self.__class__.__name__)
        self.sql_provider = SqlProvider(model=TeacherInfoManageData, sql_config_path=self.sql_config_path)
    
    def register_routes(self, app: FastAPI):
        """注册教师信息相关的路由"""
        app.get("/api/teacher_info")(self.get_teacher_info)
        app.post("/api/teacher_info")(self.post_teacher_info)
        app.post("/api/teacher_info/save")(self.save_teacher_info)
        app.post("/api/teacher_info/update")(self.update_teacher_info)
        app.post("/api/teacher_info/delete")(self.delete_teacher_info)
    
    async def get_teacher_info(
        self,
        teacher_code: Optional[str] = None,
        teacher_name: Optional[str] = None,
        department: Optional[str] = None,
        status: Optional[str] = None,
    ):
        """
        GET请求 - 支持获取所有教师信息或按条件筛选
        Examples:
        - GET /api/teacher_info -> 获取所有教师信息
        - GET /api/teacher_info?teacher_code=T001 -> 获取编号为T001的教师信息
        - GET /api/teacher_info?department=数学系 -> 获取数学系的所有教师
        """
        condition = {}
        if teacher_code is not None:
            condition["teacher_code"] = teacher_code
        if teacher_name is not None:
            condition["teacher_name"] = teacher_name
        if department is not None:
            condition["department"] = department
        if status is not None:
            condition["status"] = status
            
        sql_provider = None
        try:
            sql_provider = SqlProvider(model=TeacherInfoManageData, sql_config_path=self.sql_config_path)
            result = await sql_provider.get_record_by_condition(condition=condition)
            json_compatible_result = jsonable_encoder(result)
            
            return JSONResponse(
                status_code=200,
                content={"success": True, "data": json_compatible_result, "timestamp": datetime.now().isoformat()}
            )
        except Exception as e:
            self.logger.error(f"获取教师信息失败: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"获取教师信息失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
        finally:
            if sql_provider:
                await sql_provider.close()
                await asyncio.sleep(0.1)

    async def post_teacher_info(
        self,
        teacher_request: TeacherInfoRequest,
    ):
        """
        POST请求 - 支持获取所有教师信息或按条件筛选
        Examples:
        - POST /api/teacher_info {} -> 获取所有教师信息
        - POST /api/teacher_info {"teacher_code": "T001"} -> 获取编号为T001的教师信息
        """
        try:
            teacher_code = teacher_request.teacher_code
            teacher_name = teacher_request.teacher_name
            department = teacher_request.department
            status = teacher_request.status
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": f"传参错误！{str(e)}", "data": None, "timestamp": datetime.now().isoformat()}
            )
        
        try:
            result = await self.get_teacher_info(teacher_code, teacher_name, department, status)
            return result
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"获取教师数据失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )

    def search_avatar_images(self, query, filename=None, save_path="/work/ai/agent_chainlit/api/source"):
        """
        搜索并下载教师头像图片
        """
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            'q': f"{query} 教师 头像 professional portrait",
            'cx': "169ae7f2f9875403d",
            'key': "AIzaSyDE4GtUjV5AaRaCsY4dyM2ZvuxEkkG308Q",
            'searchType': 'image',
            'num': 5,
            'safe': 'active',
            'imgSize': 'medium',
        }

        print(f"搜索头像参数: {params}")

        session = requests.Session()

        try:
            response = session.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()

            print(f"搜索结果: 找到 {len(data.get('items', []))} 张图片")

            if 'items' not in data or len(data['items']) == 0:
                return {'success': False, 'error': '没有找到相关头像图片'}

            os.makedirs(save_path, exist_ok=True)
            download_errors = []

            for i, image_item in enumerate(data['items']):
                image_url = image_item['link']
                image_title = image_item.get('title', query)

                print(f"尝试下载第 {i+1} 张头像: {image_url}")

                if not image_url.startswith(('http://', 'https://')):
                    download_errors.append(f"URL格式无效: {image_url}")
                    continue

                max_retries = 3
                retry_count = 0

                while retry_count < max_retries:
                    try:
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

                        img_response = session.get(
                            image_url,
                            timeout=(15, 30),
                            headers=headers,
                            stream=True,
                            verify=False,
                            allow_redirects=True
                        )
                        img_response.raise_for_status()

                        content_type = img_response.headers.get('content-type', '').lower()
                        if not any(img_type in content_type for img_type in ['image/', 'jpeg', 'jpg', 'png', 'webp']):
                            download_errors.append(f"不是图片文件: {content_type}")
                            break

                        content_length = img_response.headers.get('content-length')
                        if content_length and int(content_length) > 10 * 1024 * 1024:
                            download_errors.append(f"文件太大: {int(content_length)/1024/1024:.1f}MB")
                            break

                        if filename is None:
                            parsed_url = urlparse(image_url)
                            ext = os.path.splitext(parsed_url.path)[1].lower()

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
                                    ext = '.jpg'

                            safe_title = "".join(c for c in image_title if c.isalnum() or c in (' ', '-', '_')).strip()
                            if not safe_title:
                                safe_title = query
                            
                            filename = f"teacher_{safe_title[:20]}_avatar{i+1}{ext}"
                            filename = self.sanitize_filename(filename)
                        else:
                            filename = self.sanitize_filename(filename)

                        full_path = os.path.join(save_path, filename)

                        if os.path.exists(full_path):
                            name, ext = os.path.splitext(filename)
                            timestamp = int(time.time())
                            filename = f"{name}_{timestamp}{ext}"
                            full_path = os.path.join(save_path, filename)

                        total_size = 0
                        max_size = 10 * 1024 * 1024

                        with open(full_path, 'wb') as f:
                            for chunk in img_response.iter_content(chunk_size=8192):
                                if chunk:
                                    f.write(chunk)
                                    total_size += len(chunk)
                                    if total_size > max_size:
                                        f.close()
                                        os.remove(full_path)
                                        raise Exception(f"文件太大: {total_size/1024/1024:.1f}MB")

                        if os.path.exists(full_path) and os.path.getsize(full_path) > 0:
                            self.logger.info(f"头像下载成功: {full_path} ({total_size/1024:.1f}KB)")
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
                            break

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
                            break

                    except Exception as e:
                        download_errors.append(f"下载失败: {str(e)}")
                        break

                time.sleep(0.5)

            error_summary = "; ".join(download_errors[:3])
            return {
                'success': False,
                'error': f'所有头像下载都失败了。错误示例: {error_summary}',
                'all_errors': download_errors
            }

        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': f'搜索请求错误: {str(e)}'}
        except Exception as e:
            return {'success': False, 'error': f'未知错误: {str(e)}'}


    def sanitize_filename(self, filename):
        import re
        import hashlib
        
        name, ext = os.path.splitext(filename)
        
        if (len(name) > 50 or 
            re.search(r'[\u4e00-\u9fff]', name) or
            len(re.sub(r'[a-zA-Z0-9_\-]', '', name)) > 5):
            
            hash_short = hashlib.md5(name.encode()).hexdigest()[:8]
            timestamp = int(time.time())
            name = f"teacher_{hash_short}_{timestamp}"
        else:
            name = re.sub(r'[^\w\-]', '_', name)
            name = re.sub(r'_+', '_', name)
        
        filename = name + ext
        return filename.strip('_.')

    async def save_teacher_info(
        self,
        teacher_request: TeacherInfoRequest,
    ):
        """保存教师信息"""
        try:
            self.logger.info(f"收到教师信息保存请求: {teacher_request}")
            
            if not teacher_request.teacher_code:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供教师编号", "timestamp": datetime.now().isoformat()}
                )
            
            if not teacher_request.teacher_name:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供教师姓名", "timestamp": datetime.now().isoformat()}
                )

            # 检查教师编号是否已存在
            check_request = TeacherInfoRequest(teacher_code=teacher_request.teacher_code)
            response = await self.post_teacher_info(check_request)
            response = utils.parse_server_return(response)
            if response:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False, 
                        "message": f"""<confirm content="确认修改教师：{teacher_request.teacher_name}">教师编号{teacher_request.teacher_code}已经存在，请问您是否要修改？</confirm>""", 
                        "timestamp": datetime.now().isoformat()
                    }
                )

            # 准备插入数据
            insert_data = {
                "teacher_code": teacher_request.teacher_code,
                "teacher_name": teacher_request.teacher_name,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }

            # 设置可选字段的默认值或使用提供的值
            insert_data["gender"] = teacher_request.gender or "男"
            insert_data["phone"] = teacher_request.phone or ""
            insert_data["email"] = teacher_request.email or ""
            insert_data["department"] = teacher_request.department or "未分配"
            insert_data["position"] = teacher_request.position or "教师"
            insert_data["specialty"] = teacher_request.specialty or "待完善"
            insert_data["education_background"] = teacher_request.education_background or "待完善"
            insert_data["status"] = teacher_request.status or "在职"

            # 处理日期字段
            if teacher_request.birth_date:
                insert_data["birth_date"] = datetime.strptime(teacher_request.birth_date, '%Y-%m-%d').date()
            
            if teacher_request.hire_date:
                insert_data["hire_date"] = datetime.strptime(teacher_request.hire_date, '%Y-%m-%d').date()
            else:
                insert_data["hire_date"] = datetime.now().date()

            # 处理头像
            if teacher_request.avatar_url:
                insert_data["avatar_url"] = teacher_request.avatar_url
            else:
                result = self.search_avatar_images(query=teacher_request.teacher_name, save_path="/work/ai/agent_chainlit/api/source")
                avatar_url = ""
                print(f"头像搜索结果: {result}")
                if result["success"]:
                    file_name = result["filename"]
                    avatar_url = f"https://ai.shunxikj.com:8890/api/files/download/{file_name}"
                insert_data["avatar_url"] = avatar_url

            result = await self.sql_provider.add_record(insert_data)
            print(f"保存结果: {result}")
            
            if result:
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": "教师信息保存成功", "data": str(result), "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": "数据库添加记录失败", "timestamp": datetime.now().isoformat()}
                )

        except Exception as e:
            import traceback
            self.logger.error(f"保存教师信息失败: {str(e)}\n{traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"保存失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )

    async def update_teacher_info(
        self,
        teacher_request: TeacherInfoRequest,
    ):
        """更新教师信息"""
        try:
            self.logger.info(f"收到教师信息更新请求: {teacher_request}")
            
            if not teacher_request.teacher_code:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供教师编号", "timestamp": datetime.now().isoformat()}
                )

            # 查找现有教师信息
            check_request = TeacherInfoRequest(teacher_code=teacher_request.teacher_code)
            response = await self.post_teacher_info(check_request)
            import json
            if hasattr(response, 'body'):
                response = json.loads(response.body.decode())
            
            if response.get("success"):
                existing_data = response.get("data", [])
                print(f"查询到 {len(existing_data)} 条教师记录")
            else:
                existing_data = []
                print(f"查询失败: {response.get('message')}")

            if not existing_data:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": f"教师编号{teacher_request.teacher_code}不存在", "timestamp": datetime.now().isoformat()}
                )

            existing_teacher = existing_data[0]
            print(f"现有教师数据: {existing_teacher}")

            # 准备更新数据，保留原有数据或使用新提供的数据
            update_data = {
                "teacher_code": teacher_request.teacher_code,
                "updated_at": datetime.now()
            }

            # 更新各个字段
            update_data["teacher_name"] = teacher_request.teacher_name or existing_teacher["teacher_name"]
            update_data["gender"] = teacher_request.gender or existing_teacher["gender"]
            update_data["phone"] = teacher_request.phone or existing_teacher["phone"]
            update_data["email"] = teacher_request.email or existing_teacher["email"]
            update_data["department"] = teacher_request.department or existing_teacher["department"]
            update_data["position"] = teacher_request.position or existing_teacher["position"]
            update_data["specialty"] = teacher_request.specialty or existing_teacher["specialty"]
            update_data["education_background"] = teacher_request.education_background or existing_teacher["education_background"]
            update_data["status"] = teacher_request.status or existing_teacher["status"]

            # 处理日期字段
            if teacher_request.birth_date:
                update_data["birth_date"] = datetime.strptime(teacher_request.birth_date, '%Y-%m-%d').date()
            elif existing_teacher["birth_date"]:
                update_data["birth_date"] = datetime.strptime(existing_teacher["birth_date"], '%Y-%m-%d').date()

            if teacher_request.hire_date:
                update_data["hire_date"] = datetime.strptime(teacher_request.hire_date, '%Y-%m-%d').date()
            elif existing_teacher["hire_date"]:
                update_data["hire_date"] = datetime.strptime(existing_teacher["hire_date"], '%Y-%m-%d').date()

            # 处理头像
            if teacher_request.avatar_url:
                update_data["avatar_url"] = teacher_request.avatar_url
            else:
                if existing_teacher["avatar_url"]:
                    update_data["avatar_url"] = existing_teacher["avatar_url"]
                else:
                    result = self.search_avatar_images(query=update_data["teacher_name"], save_path="/work/ai/agent_chainlit/api/source")
                    avatar_url = ""
                    print(f"头像搜索结果: {result}")
                    if result["success"]:
                        file_name = result["filename"]
                        avatar_url = f"https://ai.shunxikj.com:8890/api/files/download/{file_name}"
                    update_data["avatar_url"] = avatar_url

            print(f"更新数据: {update_data}")

            # 删除旧记录并插入新记录
            delete_result = await self.sql_provider.delete_record(record_id=existing_teacher["teacher_id"], hard_delete=True,id_field="teacher_id")
            print(delete_result)
            result = await self.sql_provider.add_record(update_data)

            # result = await self.sql_provider.update_record(record_id=existing_teacher["teacher_id"], update_data=update_data)
        

            
            
            print(f"更新结果: {result}")
            
            if result:
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": "教师信息更新成功", "data": str(result), "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": "数据库更新记录失败", "timestamp": datetime.now().isoformat()}
                )

        except Exception as e:
            import traceback
            self.logger.error(f"更新教师信息失败: {str(e)}\n{traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"更新失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )

    async def delete_teacher_info(
        self,
        teacher_request: TeacherInfoRequest,
    ):
        """删除教师信息"""
        try:
            self.logger.info(f"收到教师信息删除请求: {teacher_request}")
            
            if not teacher_request.teacher_code:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供要删除的教师编号", "timestamp": datetime.now().isoformat()}
                )

            # 查找要删除的教师信息
            check_request = TeacherInfoRequest(teacher_code=teacher_request.teacher_code)
            response = await self.post_teacher_info(check_request)
            import json
            if hasattr(response, 'body'):
                response = json.loads(response.body.decode())
            
            if response.get("success"):
                existing_data = response.get("data", [])
                print(f"查询到 {len(existing_data)} 条教师记录")
            else:
                existing_data = []
                print(f"查询失败: {response.get('message')}")

            if existing_data:
                existing_teacher = existing_data[0]
                delete_result = await self.sql_provider.delete_record(record_id=existing_teacher["teacher_id"], hard_delete=True,id_field="teacher_id")
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": f"教师{existing_teacher['teacher_name']}删除成功", "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": f"删除失败！教师编号{teacher_request.teacher_code}不存在", "timestamp": datetime.now().isoformat()}
                )

        except Exception as e:
            import traceback
            self.logger.error(f"删除教师信息失败: {str(e)}\n{traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"删除教师信息失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )


if __name__ == '__main__':
    from pathlib import Path
    import asyncio
    
    ROOT_DIRECTORY = Path(__file__).parent.parent.parent.parent
    SQL_CONFIG_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / "sql_config.yaml")
    
    async def main():
        teacher_server = TeacherInfoServer(sql_config_path=SQL_CONFIG_PATH)
        response = await teacher_server.get_teacher_info()
        print(response)
        
    asyncio.run(main())