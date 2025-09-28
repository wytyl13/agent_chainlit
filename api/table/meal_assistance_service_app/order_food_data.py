#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/16 
@Author  : weiyutao
@File    : order_food_data.py
"""

from sqlalchemy import Column, String, Integer, Float, Text, DateTime, func, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

from api.table.base.base import Base

class OrderFoodData(Base):
    """点菜订单数据模型"""
    __tablename__ = 'order_food_data'
    
    # 主键
    id = Column(Integer, primary_key=True, autoincrement=True, comment='自增主键')
    
    # 订单基本信息
    order_name = Column(String(100), nullable=False, comment='订单名称')
    order_id = Column(String(50), nullable=False, unique=True, comment='订单ID')
    order_time = Column(DateTime, nullable=False, comment='下单时间')
    order_type = Column(String(50), nullable=False, comment='订单类型')
    
    # 商品信息 (JSON格式存储商品列表)
    product_vo_list = Column(JSON, comment='商品列表')
    total_amount = Column(Float, nullable=False, comment='订单总金额')
    
    # 客户信息
    customer_name = Column(String(50), nullable=False, comment='客户姓名')
    customer_address = Column(String(200), nullable=False, comment='客户地址')
    customer_phone = Column(String(20), nullable=False, comment='客户电话')
    
    # 配送信息
    expected_delivery_time = Column(String(50), comment='预计送达时间')
    
    # 温馨提示信息
    warm_prompt_label = Column(String(50), comment='温馨提示标签')
    warm_prompts = Column(JSON, comment='温馨提示列表')
    
    # 订单状态
    order_status = Column(String(20), default='pending', comment='订单状态: pending/confirmed/preparing/delivering/completed/cancelled')
    
    # 时间戳
    create_time = Column(DateTime, default=func.now(), comment='创建时间')
    update_time = Column(DateTime, default=func.now(), onupdate=func.now(), comment='更新时间')
    
    def __repr__(self):
        return f"<OrderData(order_id='{self.order_id}', customer_name='{self.customer_name}', total_amount={self.total_amount}, order_status='{self.order_status}')>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'order_name': self.order_name,
            'order_id': self.order_id,
            'order_time': self.order_time.isoformat() if self.order_time else None,
            'order_type': self.order_type,
            'product_vo_list': self.product_vo_list,
            'total_amount': self.total_amount,
            'customer_name': self.customer_name,
            'customer_address': self.customer_address,
            'customer_phone': self.customer_phone,
            'expected_delivery_time': self.expected_delivery_time,
            'warm_prompt_label': self.warm_prompt_label,
            'warm_prompts': self.warm_prompts,
            'order_status': self.order_status,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            'update_time': self.update_time.isoformat() if self.update_time else None,
        }
    
    @classmethod
    def from_dict(cls, data_dict):
        """从字典创建实例"""
        # 处理时间字段
        order_time = data_dict.get('order_time')
        if isinstance(order_time, str):
            order_time = datetime.strptime(order_time, "%Y-%m-%d %H:%M:%S")
        
        return cls(
            order_name=data_dict.get('order_name'),
            order_id=data_dict.get('order_id'),
            order_time=order_time,
            order_type=data_dict.get('order_type'),
            product_vo_list=data_dict.get('product_vo_list'),
            total_amount=data_dict.get('total_amount'),
            customer_name=data_dict.get('customer_name'),
            customer_address=data_dict.get('customer_address'),
            customer_phone=data_dict.get('customer_phone'),
            expected_delivery_time=data_dict.get('expected_delivery_time'),
            warm_prompt_label=data_dict.get('warm_prompt_label'),
            warm_prompts=data_dict.get('warm_prompts'),
            order_status=data_dict.get('order_status', 'pending')
        )
    
    @classmethod
    def from_printer_data(cls, printer_data):
        """从打印数据格式创建实例"""
        # 将驼峰命名转换为下划线命名
        order_time = datetime.strptime(printer_data.get('orderTime'), "%Y-%m-%d %H:%M:%S") if printer_data.get('orderTime') else datetime.now()
        
        return cls(
            order_name=printer_data.get('orderName'),
            order_id=printer_data.get('orderId'),
            order_time=order_time,
            order_type=printer_data.get('orderType'),
            product_vo_list=printer_data.get('productVoList'),
            total_amount=printer_data.get('totalAmount'),
            customer_name=printer_data.get('customerName'),
            customer_address=printer_data.get('customerAddress'),
            customer_phone=printer_data.get('customerPhone'),
            expected_delivery_time=printer_data.get('expectedDeliveryTime'),
            warm_prompt_label=printer_data.get('warmPromptLabel'),
            warm_prompts=printer_data.get('warmPrompts'),
            order_status='pending'
        )
        

if __name__ == '__main__':

    from pathlib import Path
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text

    from agent.config.sql_config import SqlConfig
    from api.table.base import Base

    ROOT_DIRECTORY = Path(__file__).parent.parent.parent
    SQL_CONFIG_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / "sql_config.yaml")

    async def check_table_exists(engine, table_name):
        """检查表是否存在"""
        async with engine.begin() as conn:
            try:
                result = await conn.execute(text(f"SELECT 1 FROM {table_name} LIMIT 1"))
                return True
            except Exception:
                return False

    async def create_order_table():
        """创建订单表"""
        sql_config = SqlConfig.from_file(SQL_CONFIG_PATH)
        engine = create_async_engine(sql_config.sql_url)
        
        try:
            # 检查表是否已存在
            table_exists = await check_table_exists(engine, 'order_data')
            
            if table_exists:
                print("订单表 'order_data' 已存在")
                
                while True:
                    user_choice = input("是否要删除现有表并重新创建？(y/n): ").strip().lower()
                    
                    if user_choice in ['y', 'yes', '是']:
                        print("正在删除现有订单表...")
                        async with engine.begin() as conn:
                            await conn.execute(text("DROP TABLE IF EXISTS order_data"))
                        print("现有表已删除")
                        break
                    elif user_choice in ['n', 'no', '否']:
                        print("保留现有表，操作取消")
                        return
                    else:
                        print("请输入 y(是) 或 n(否)")
            
            # 创建表
            print("正在创建订单表...")
            async with engine.begin() as conn:
                # 只创建 OrderFoodData 对应的表
                await conn.run_sync(lambda sync_conn: OrderFoodData.__table__.create(sync_conn, checkfirst=True))
            
            print("订单表创建成功！")
            
            # 验证表创建是否成功
            table_created = await check_table_exists(engine, 'order_data')
            if table_created:
                print("✓ 验证成功：订单表已正确创建")
            else:
                print("✗ 验证失败：订单表创建可能有问题")
                
        except Exception as e:
            print(f"创建订单表时发生错误: {e}")
            raise
        finally:
            await engine.dispose()

    async def test_table():
        """测试表是否可以正常使用"""
        from agent.provider.sql_provider import SqlProvider
        
        print("\n正在测试订单表...")
        
        try:
            sql_provider = SqlProvider(model=OrderFoodData, sql_config_path=SQL_CONFIG_PATH)
            
            # 测试查询
            result = await sql_provider.get_record_by_condition(condition={})
            print(f"✓ 查询测试成功：当前表中有 {len(result)} 条记录")
            
            await sql_provider.close()
            
        except Exception as e:
            print(f"✗ 表测试失败: {e}")

    import asyncio
    
    async def main():
        await create_order_table()
        await test_table()
        print("\n订单表创建和测试完成！")
    
    asyncio.run(main())