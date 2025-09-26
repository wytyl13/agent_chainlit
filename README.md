# AgentChainlit

🚀 基于Docker的智能AgentChainlit问答系统。

## 📋 目录

- [特性](#特性)
- [快速开始](#快速开始)
- [架构设计](#架构设计)
- [项目结构](#项目结构)
- [配置说明](#配置说明)
- [API文档](#api文档)
- [开发指南](#开发指南)

## ✨ 特性

- 🐳 **Docker容器化部署** - 完整的Docker部署方案，支持GPU加速
- 🔧 **模块化架构** - 基于Agent核心库的可扩展架构
- 🗄️ **多数据库支持** - 兼容PostgreSQL和MySQL数据库
- 🔌 **前后端分离** - RESTful API设计，支持多种参数传递方式
- ⚡ **GPU加速** - 内置CUDA支持，提升AI模型性能
- 🛠️ **工具基类** - 提供完整的工具开发基础框架

## 🚀 快速开始

### 前置要求

- Docker & Docker Compose
- NVIDIA GPU驱动（用于GPU加速）
- 8GB+ 内存推荐

### 部署步骤

#### 1. 准备环境

```bash
# 拉取NVIDIA CUDA基础镜像（先查看是否docker容器是否有该镜像，如果有忽略）
docker images
docker pull nvidia/cuda:12.8.0-cudnn-devel-ubuntu22.04

# 创建Docker网络
docker network create app-network
```

#### 2. 启动agent_chainlit容器

```bash
docker run -d \
  --name community_agent \
  --gpus all \
  --cpus="$(nproc)" \
  --memory="$(free -b | awk '/^Mem:/{printf "%.0f", $2*0.4}')" \
  --shm-size=16g \
  -p 9000-9100:9000-9100 \
  --restart unless-stopped \
  -v /home/weiyutao/cuda-data-1:/data \
  -v /home/weiyutao/cuda-workspace-1:/workspace \
  -e NVIDIA_VISIBLE_DEVICES=all \
  -e NVIDIA_DRIVER_CAPABILITIES=all \
  --privileged \
  -it \
  nvidia/cuda:12.8.0-cudnn-devel-ubuntu22.04 \
  /bin/bash
```

#### 3. 启动PostgreSQL数据库

```bash
# 运行PostgreSQL初始化脚本（先查看是否有postgres这个镜像，如果有直接运行脚本，没有则需要拉取镜像）
docker pull postgres:latest
sudo bash postgres_docker_contanier_init.sh postgres_dev 5432
```

#### 4. 配置网络连接

```bash
# 将容器连接到网络
docker network connect app-network agent
docker network connect app-network postgres_dev
```

#### 5. 环境配置

```bash
# 进入Agent容器
docker exec -it agent_chainlit bash

# 系统更新和依赖安装
apt update && apt install wget lsof git

# 创建工作目录
mkdir -p /work/soft
mkdir -p /work/ai

# 下载和安装Anaconda
cd /work/soft
wget https://repo.anaconda.com/archive/Anaconda3-2024.06-1-Linux-x86_64.sh
bash Anaconda3-2024.06-1-Linux-x86_64.sh

# 初始化conda环境
source ~/.bashrc  # 可选
/work/soft/anaconda3/bin/conda init bash # 可选（如果执行source ~/.bashrc不成功）
```

#### 6. 部署应用

```bash
# 克隆项目代码
cd /work/ai
git clone https://github.com/wytyl13/agent_chainlit.git

# 安装Python依赖
cd agent_chainlit
conda create --name agent_chainlit python=3.10
conda activate agent_chainlit
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
agent init # 会在当前项目下创建需要配置的环境变量文件.env和config配置文件，按照后续的配置说明进行配置

# 在.env文件中添加如下环境变量



# 启动服务
bash api.sh       # 启动API服务
bash chainlit.sh  # 启动Chainlit服务
```

### 🎯 访问服务

- **API服务**: http://ip:8891
- **Chainlit界面**: http://ip:5004

## 🏗️ 架构设计

### 核心原则

1. **Agent核心库驱动** - 所有功能基于Agent库构建，包含：
   - 🔧 工具基类
   - 🗄️ 数据库配置基类  
   - 🤖 大语言模型配置基类
   - 🛠️ 完整工具开发框架

2. **前后端分离架构** - 页面之外的所有功能以服务形式提供

3. **API服务设计** - 包含表结构信息和服务编写，支持：
   - URL参数传递
   - JSON请求体传递
   - 依赖项目核心库

4. **数据库抽象层** - SQL Provider基类特性：
   - 兼容PostgreSQL和MySQL
   - 统一deleted字段处理（整形存储，支持布尔值传递）
   - SmallInteger (PostgreSQL) / TINYINT (MySQL)

## 📁 项目结构

```
agent_chainlit/
├── agent/                 # Agent核心库
├── api/                   # API服务层
├── logs/                  # 日志文件
├── models/                # AI模型文件
├── retrieval_data/        # 检索数据
├── retrieval_storage/     # 检索存储
├── upload_dir/           # 上传文件目录
├── public/               # 静态资源
├── cert/                 # 证书文件
├── .env                  # 环境配置文件
├── requirements.txt      # Python依赖
├── api.sh               # API服务启动脚本
└── chainlit.sh          # Chainlit服务启动脚本
```

## ⚙️ 配置说明

所有动态配置都在根目录下的 `.env` 文件中进行管理。

### 环境变量示例
配置修改：
1、修改.env_case文件中的端口、路由配置
2、修改agent框架重的sql_config、search_config、ollama_config配置
3、新增cert文件夹存储对应域名的https秘钥验证
4、调用api_server.sh脚本、chainlit.sh脚本（自动下载依赖的models，存储到models文件中）
```bash

# .env文件配置（修改.env_case文件名称为.env并修改对应配置信息）

# agent核心库相关配置
SEARCH_CONFIG_PATH=config/yaml/search_config.yaml # google搜索配置文件路径
LLM_CONFIG_PATH=config/yaml/ollama_config.yaml # llm配置文件路径
SQL_CONFIG_PATH=config/yaml/sql_config.yaml # 数据库配置文件路径
TOOL_CONFIG_PATH=config/yaml/tool_config.yaml # 工具配置文件路径
RETRIEVAL_DATA_PATH=retrieval_data # 知识库存储路径
RETRIEVAL_STORAGE_PATH=retrieval_storage # 向量数据库持久化存储路径
API_PREFIX=https://ai.shunxikj.com:8890 # api前缀
MODEL_PATH=models # 模型下载路径


CHAINLIT_AUTH_SECRET="8vw,_SphkplSkRn_HjN9tnKaQ%5,s7_N%XSWdl22UrBnI7/e7_0o%S1a~E*%n8lW" # chainlit秘钥
API_PORT=8890
CHAINLIT_PORT=5002 # chainlit端口
CONDA_ENVIRONMENT="agent_chainlit" # conda虚拟环境名称
CONDA_ENV_PATH="/work/soft/anaconda3" # conda虚拟环境安装路径
API_PREFIX="https://ai.shunxikj.com:${API_PORT}" API请求前缀



# postgresql_config.yaml数据库配置（修改agent/config/yaml/postgresql_config_case.yaml文件名称为postgresql_config.yaml并修改对应配置信息）
host: postgres_20250811
port: 5432
username: 
password: 
database: postgres
table: sx_device_wavve_vital_sign_log
database_type: postgres


# /work/ai/agent_/agent/config/yaml/ollama_config_qwen.yaml文件配置
api_type: "ollama"  # 模型服务类型
model: "qwen2.5:7b-instruct"  # 模型名称
base_url: "http://192.168.0.17:11434/api" # api服务


# agent_/agent/config/yaml/search_config.yaml文件配置
blocked_domains: # 过滤网页
  - youtube.com
  - vimeo.com
  - dailymotion.com
  - bilibili.com
# cx: '43cf2dbf880b24cb0'
# key: 'AIzaSyBIzlzwDtbzm7O4g3DzC8JrKe6hfo43TAc'
cx: # google search config
key: # google search  config
snippet_flag: # 标志符
query_num: # 检索条目数
```


## 📚 API文档
### 📚 用户订餐接口
#### 场景1：
https://ai.shunxikj.com:8890/chat/function_call/food_user_server   POST
JSON请求体:
{
   "question": "查看菜品信息",
   "messages": []
}

RESPONSE:  标签card使用卡片渲染  
{
	"success": true,
	"data": "[\n  {\n    \"type\": \"tag\",\n    \"tag_name\": \"card\",\n    \"content\": \"[\\n  {\\n    \\\"dish_name\\\": \\\"宫保鸡丁\\\",\\n    \\\"category\\\": \\\"川菜\\\",\\n    \\\"ingredients\\\": \\\"鸡肉、花生、青椒、红椒\\\",\\n    \\\"rating\\\": 4.8,\\n    \\\"url\\\": \\\"https://ai.shunxikj.com:8890/api/files/download/宫保鸡丁.jpg\\\",\\n    \\\"update_time\\\": \\\"2025-09-15T21:49:28.357785\\\",\\n    \\\"id\\\": 4,\\n    \\\"price\\\": 28.0,\\n    \\\"nutrition\\\": \\\"高蛋白、维生素C\\\",\\n    \\\"description\\\": \\\"经典川菜，麻辣鲜香，鸡肉嫩滑配花生脆香\\\",\\n    \\\"create_time\\\": \\\"2025-09-15T21:49:28.357782\\\"\\n  },\\n  {\\n    \\\"dish_name\\\": \\\"红烧狮子头\\\",\\n    \\\"category\\\": \\\"淮扬菜\\\",\\n    \\\"ingredients\\\": \\\"猪肉、马蹄、冬菇、青菜\\\",\\n    \\\"rating\\\": 4.6,\\n    \\\"url\\\": \\\"https://ai.shunxikj.com:8890/api/files/download/红烧狮子头.jpg\\\",\\n    \\\"update_time\\\": \\\"2025-09-15T21:50:06.813752\\\",\\n    \\\"id\\\": 5,\\n    \\\"price\\\": 35.0,\\n    \\\"nutrition\\\": \\\"高蛋白、膳食纤维\\\",\\n    \\\"description\\\": \\\"淮扬名菜，肉质鲜嫩，汤汁醇厚，营养丰富\\\",\\n    \\\"create_time\\\": \\\"2025-09-15T21:50:06.813751\\\"\\n  },\\n  {\\n    \\\"dish_name\\\": \\\"清蒸鲈鱼\\\",\\n    \\\"category\\\": \\\"粤菜\\\",\\n    \\\"ingredients\\\": \\\"新鲜鲈鱼、蒸鱼豉油、葱丝\\\",\\n    \\\"rating\\\": 4.9,\\n    \\\"url\\\": \\\"https://ai.shunxikj.com:8890/api/files/download/清蒸鲈鱼.jpg\\\",\\n    \\\"update_time\\\": \\\"2025-09-15T21:50:43.587513\\\",\\n    \\\"id\\\": 6,\\n    \\\"price\\\": 42.0,\\n    \\\"nutrition\\\": \\\"高蛋白、低脂肪、DHA\\\",\\n    \\\"description\\\": \\\"粤式经典，鱼肉鲜嫩，保持原汁原味\\\",\\n    \\\"create_time\\\": \\\"2025-09-15T21:50:43.587511\\\"\\n  },\\n  {\\n    \\\"dish_name\\\": \\\"麻婆豆腐\\\",\\n    \\\"category\\\": \\\"川菜\\\",\\n    \\\"ingredients\\\": \\\"嫩豆腐、牛肉末、豆瓣酱、花椒\\\",\\n    \\\"rating\\\": 4.7,\\n    \\\"url\\\": \\\"https://ai.shunxikj.com:8890/api/files/download/麻婆豆腐.jpg\\\",\\n    \\\"update_time\\\": \\\"2025-09-15T21:51:15.073792\\\",\\n    \\\"id\\\": 7,\\n    \\\"price\\\": 18.0,\\n    \\\"nutrition\\\": \\\"植物蛋白、钙质、维生素\\\",\\n    \\\"description\\\": \\\"川菜经典，麻辣鲜香，豆腐嫩滑入味\\\",\\n    \\\"create_time\\\": \\\"2025-09-15T21:51:15.073791\\\"\\n  },\\n  {\\n    \\\"dish_name\\\": \\\"糖醋排骨\\\",\\n    \\\"category\\\": \\\"家常菜\\\",\\n    \\\"ingredients\\\": \\\"猪排骨、番茄酱、糖、醋、生抽\\\",\\n    \\\"rating\\\": 4.8,\\n    \\\"url\\\": \\\"https://ai.shunxikj.com:8890/api/files/download/糖醋排骨.jpg\\\",\\n    \\\"update_time\\\": \\\"2025-09-15T21:51:51.148818\\\",\\n    \\\"id\\\": 8,\\n    \\\"price\\\": 32.0,\\n    \\\"nutrition\\\": \\\"高蛋白、胶原蛋白、钙质\\\",\\n    \\\"description\\\": \\\"酸甜可口，色泽红亮，老少皆宜的经典菜品\\\",\\n    \\\"create_time\\\": \\\"2025-09-15T21:51:51.148816\\\"\\n  },\\n  {\\n    \\\"dish_name\\\": \\\"西红柿鸡蛋\\\",\\n    \\\"category\\\": \\\"家常菜\\\",\\n    \\\"ingredients\\\": \\\"新鲜西红柿、鸡蛋、糖、盐\\\",\\n    \\\"rating\\\": 0.0,\\n    \\\"url\\\": \\\"https://ai.shunxikj.com:8890/api/files/download/西红柿鸡蛋.jpg\\\",\\n    \\\"update_time\\\": \\\"2025-09-15T23:14:57.763230\\\",\\n    \\\"id\\\": 10,\\n    \\\"price\\\": 15.0,\\n    \\\"nutrition\\\": \\\"优质蛋白、番茄红素、维生素\\\",\\n    \\\"description\\\": \\\"国民家常菜，酸甜开胃，营养均衡\\\",\\n    \\\"create_time\\\": \\\"2025-09-15T23:14:57.767162\\\"\\n  }\\n]\",\n    \"full_match\": \"<card name=\\\"MenuCards\\\" content=\\\"为您查到6条菜品信息：宫保鸡丁、红烧狮子头、清蒸鲈鱼、麻婆豆腐、糖醋排骨、西红柿鸡蛋，菜品详细信息如下：\\\">[\\n  {\\n    \\\"dish_name\\\": \\\"宫保鸡丁\\\",\\n    \\\"category\\\": \\\"川菜\\\",\\n    \\\"ingredients\\\": \\\"鸡肉、花生、青椒、红椒\\\",\\n    \\\"rating\\\": 4.8,\\n    \\\"url\\\": \\\"https://ai.shunxikj.com:8890/api/files/download/宫保鸡丁.jpg\\\",\\n    \\\"update_time\\\": \\\"2025-09-15T21:49:28.357785\\\",\\n    \\\"id\\\": 4,\\n    \\\"price\\\": 28.0,\\n    \\\"nutrition\\\": \\\"高蛋白、维生素C\\\",\\n    \\\"description\\\": \\\"经典川菜，麻辣鲜香，鸡肉嫩滑配花生脆香\\\",\\n    \\\"create_time\\\": \\\"2025-09-15T21:49:28.357782\\\"\\n  },\\n  {\\n    \\\"dish_name\\\": \\\"红烧狮子头\\\",\\n    \\\"category\\\": \\\"淮扬菜\\\",\\n    \\\"ingredients\\\": \\\"猪肉、马蹄、冬菇、青菜\\\",\\n    \\\"rating\\\": 4.6,\\n    \\\"url\\\": \\\"https://ai.shunxikj.com:8890/api/files/download/红烧狮子头.jpg\\\",\\n    \\\"update_time\\\": \\\"2025-09-15T21:50:06.813752\\\",\\n    \\\"id\\\": 5,\\n    \\\"price\\\": 35.0,\\n    \\\"nutrition\\\": \\\"高蛋白、膳食纤维\\\",\\n    \\\"description\\\": \\\"淮扬名菜，肉质鲜嫩，汤汁醇厚，营养丰富\\\",\\n    \\\"create_time\\\": \\\"2025-09-15T21:50:06.813751\\\"\\n  },\\n  {\\n    \\\"dish_name\\\": \\\"清蒸鲈鱼\\\",\\n    \\\"category\\\": \\\"粤菜\\\",\\n    \\\"ingredients\\\": \\\"新鲜鲈鱼、蒸鱼豉油、葱丝\\\",\\n    \\\"rating\\\": 4.9,\\n    \\\"url\\\": \\\"https://ai.shunxikj.com:8890/api/files/download/清蒸鲈鱼.jpg\\\",\\n    \\\"update_time\\\": \\\"2025-09-15T21:50:43.587513\\\",\\n    \\\"id\\\": 6,\\n    \\\"price\\\": 42.0,\\n    \\\"nutrition\\\": \\\"高蛋白、低脂肪、DHA\\\",\\n    \\\"description\\\": \\\"粤式经典，鱼肉鲜嫩，保持原汁原味\\\",\\n    \\\"create_time\\\": \\\"2025-09-15T21:50:43.587511\\\"\\n  },\\n  {\\n    \\\"dish_name\\\": \\\"麻婆豆腐\\\",\\n    \\\"category\\\": \\\"川菜\\\",\\n    \\\"ingredients\\\": \\\"嫩豆腐、牛肉末、豆瓣酱、花椒\\\",\\n    \\\"rating\\\": 4.7,\\n    \\\"url\\\": \\\"https://ai.shunxikj.com:8890/api/files/download/麻婆豆腐.jpg\\\",\\n    \\\"update_time\\\": \\\"2025-09-15T21:51:15.073792\\\",\\n    \\\"id\\\": 7,\\n    \\\"price\\\": 18.0,\\n    \\\"nutrition\\\": \\\"植物蛋白、钙质、维生素\\\",\\n    \\\"description\\\": \\\"川菜经典，麻辣鲜香，豆腐嫩滑入味\\\",\\n    \\\"create_time\\\": \\\"2025-09-15T21:51:15.073791\\\"\\n  },\\n  {\\n    \\\"dish_name\\\": \\\"糖醋排骨\\\",\\n    \\\"category\\\": \\\"家常菜\\\",\\n    \\\"ingredients\\\": \\\"猪排骨、番茄酱、糖、醋、生抽\\\",\\n    \\\"rating\\\": 4.8,\\n    \\\"url\\\": \\\"https://ai.shunxikj.com:8890/api/files/download/糖醋排骨.jpg\\\",\\n    \\\"update_time\\\": \\\"2025-09-15T21:51:51.148818\\\",\\n    \\\"id\\\": 8,\\n    \\\"price\\\": 32.0,\\n    \\\"nutrition\\\": \\\"高蛋白、胶原蛋白、钙质\\\",\\n    \\\"description\\\": \\\"酸甜可口，色泽红亮，老少皆宜的经典菜品\\\",\\n    \\\"create_time\\\": \\\"2025-09-15T21:51:51.148816\\\"\\n  },\\n  {\\n    \\\"dish_name\\\": \\\"西红柿鸡蛋\\\",\\n    \\\"category\\\": \\\"家常菜\\\",\\n    \\\"ingredients\\\": \\\"新鲜西红柿、鸡蛋、糖、盐\\\",\\n    \\\"rating\\\": 0.0,\\n    \\\"url\\\": \\\"https://ai.shunxikj.com:8890/api/files/download/西红柿鸡蛋.jpg\\\",\\n    \\\"update_time\\\": \\\"2025-09-15T23:14:57.763230\\\",\\n    \\\"id\\\": 10,\\n    \\\"price\\\": 15.0,\\n    \\\"nutrition\\\": \\\"优质蛋白、番茄红素、维生素\\\",\\n    \\\"description\\\": \\\"国民家常菜，酸甜开胃，营养均衡\\\",\\n    \\\"create_time\\\": \\\"2025-09-15T23:14:57.767162\\\"\\n  }\\n]</card>\",\n    \"start\": 17,\n    \"end\": 2412,\n    \"attributes\": {\n      \"name\": \"MenuCards\",\n      \"content\": \"为您查到6条菜品信息：宫保鸡丁、红烧狮子头、清蒸鲈鱼、麻婆豆腐、糖醋排骨、西红柿鸡蛋，菜品详细信息如下：\"\n    }\n  }\n]",
	"timestamp": "2025-09-16T01:15:46.516086"
}



#### 场景2：  请求或者点击卡片指定菜品进行点餐操作
```
https://ai.shunxikj.com:8890/chat/function_call/food_user_server   POST
JSON请求体:
{
   "question": "预定1份宫保鸡丁",
   "messages": [
        {"role": "user", "content": "查看菜品信息"},
        {"role": "assistant", "content": "为您查到6条菜品信息：宫保鸡丁、红烧狮子头、清蒸鲈鱼、麻婆豆腐、糖醋排骨、西红柿鸡蛋，菜品详细信息如下："}
   ]
}


RESPONSE: 进行订单确认操作，自动打印订单小票
{
	"success": true,
	"data": "[\n  {\n    \"type\": \"text\",\n    \"content\": \"🍽️ 助餐订单确认\\n📋 订单详情\\n**菜品名称：** 宫保鸡丁\\n**菜品编号：** gongbaojiding\\n**份数：** 1份\\n**单价：** 25.0元/份\\n\\n**总金额：** 25.0元\\n👤 客户信息\\n**客户姓名：** 张秀英\\n**送餐地址：** 幸福小区3栋201室\\n**联系电话：** 138****5678\\n🕐 用餐安排\\n**用餐时间：** 今日午餐\\n**特殊要求：** 少放盐，口味清淡\",\n    \"start\": 0,\n    \"end\": 206\n  },\n  {\n    \"type\": \"tag\",\n    \"tag_name\": \"confirm\",\n    \"content\": \"请确认您的订单？\",\n    \"full_match\": \"<confirm content=\\\"确认点餐：宫保鸡丁*1\\\">请确认您的订单？</confirm>\",\n    \"start\": 206,\n    \"end\": 255,\n    \"attributes\": {\n      \"content\": \"确认点餐：宫保鸡丁*1\"\n    }\n  }\n]",
	"timestamp": "2025-09-16T01:17:03.548464"
}
```


#### 场景3：  用户点击确认以后直接发送请求
```
https://ai.shunxikj.com:8890/chat/function_call/food_user_server   POST
用户点击确认按钮以后，前端发送指定字段的内容作为question="确认点餐：宫保鸡丁*1" (取自场景2返回值中的attributes字段中的content字段)
JSON请求体:
{
   "question": "预定1份宫保鸡丁",
   "messages": [
        {"role": "user", "content": "查看菜品信息"},
        {"role": "assistant", "content": "为您查到6条菜品信息：宫保鸡丁、红烧狮子头、清蒸鲈鱼、麻婆豆腐、糖醋排骨、西红柿鸡蛋，菜品详细信息如下："},
        {"role": "user", "content": "预定1份宫保鸡丁"},
        {"role": "user", "assistant": "请确认您的订单？"}, # 取自场景2返回值的tag标签类型为confirm的content字段内容
        {"role": "assistant", "content": "预定1份宫保鸡丁"},
   ],
   "is_ensure": 1 # 注意不要忘记这个参数，固定传参为1，仅在这个场景中传递
}
```

### 📚 食堂菜单管理员接口
#### 场景1：






## 🔧 开发指南

### 添加新工具

1. 继承工具基类
2. 实现必要的接口方法
3. 在Agent核心库中注册

### 数据库操作

使用SQL Provider基类进行数据库操作：

```python
from agent.sql_provider import SQLProvider
# 创建数据库连接
provider = SQLProvider()

# 支持布尔值deleted字段
provider.create(table_name, data={'deleted': False})
```

## 🤝 贡献

欢迎提交Pull Request和Issue来改进这个项目！

## 📄 许可证

此项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

⭐ 如果这个项目对你有帮助，请给它一个Star！