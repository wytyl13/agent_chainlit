# Agent 核心库

🚀 基于Docker的智能Agent核心库，提供完整的后端API服务和前后端分离架构。

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

#### 2. 启动Agent容器

```bash
docker run -d \
  --name agent \
  --gpus all \
  --cpus="$(nproc)" \
  --memory="$(free -b | awk '/^Mem:/{printf "%.0f", $2*0.4}')" \
  --shm-size=16g \
  --restart unless-stopped \
  -e NVIDIA_VISIBLE_DEVICES=all \
  -e NVIDIA_DRIVER_CAPABILITIES=all \
  --privileged \
  -p 8891:8891 \
  -p 5004:5004 \
  -it \
  nvidia/cuda:12.8.0-cudnn-devel-ubuntu22.04 \
  /bin/bash
```

#### 3. 启动PostgreSQL数据库

```bash
# 运行PostgreSQL初始化脚本（先查看是否有postgres这个镜像，如果有直接运行脚本，没有则需要拉取镜像）
docker pull postgres:latest
sudo bash postgres_docker_contanier_init.sh postgres_dev 5431
```

#### 4. 配置网络连接

```bash
# 将容器连接到网络
docker network connect app-network agent
docker network connect app-network postgres
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
agent init

# 在.env文件中添加如下环境变量
CHAINLIT_AUTH_SECRET="8vw,_SphkplSkRn_HjN9tnKaQ%5,s7_N%XSWdl22UrBnI7/e7_0o%S1a~E*%n8lW"
API_PORT=8890
CHAINLIT_PORT=5002
CONDA_ENVIRONMENT="agent_chainlit"
CONDA_ENV_PATH="/work/soft/anaconda3"
API_PREFIX=
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
agent_/
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
CHAINLIT_AUTH_SECRET= # chainlit秘钥
API_PORT= # API端口
CHAINLIT_PORT=5005 # chainlit端口
CONDA_ENVIRONMENT=agent # conda虚拟环境名称
CONDA_ENV_PATH=/work/soft/anaconda # conda虚拟环境安装路径
API_PREFIX="https://ai.shunxikj.com:${API_PORT}" # API请求前缀

# postgresql_config.yaml数据库配置（修改agent/config/yaml/postgresql_config_case.yaml文件名称为postgresql_config.yaml并修改对应配置信息）
host: postgres_20250811
port: 5433
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

API服务提供RESTful接口，支持多种参数传递方式：

### 请求方式
- **URL参数**: `GET /api/endpoint?param1=value1&param2=value2`
- **JSON请求体**: `POST /api/endpoint` with JSON payload

### 响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

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