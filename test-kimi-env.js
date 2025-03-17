#!/usr/bin/env node

import OpenAI from 'openai';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

// 加载.env文件
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '.env');

if (existsSync(envPath)) {
  config({ path: envPath });
  console.log('已加载.env文件');
} else {
  config(); // 尝试加载默认.env文件
  console.log('未找到.env文件，使用环境变量');
}

// 检查环境变量
console.log('\n环境变量检查:');
console.log('KIMI_API_KEY:', process.env.KIMI_API_KEY ? '已设置 ✓' : '未设置 ✗');
console.log('KIMI_BASE_URL:', process.env.KIMI_BASE_URL || '未设置，将使用默认值');
console.log('KIMI_MODEL:', process.env.KIMI_MODEL || '未设置，将使用默认值');
console.log('KIMI_SYSTEM_PROMPT:', process.env.KIMI_SYSTEM_PROMPT ? '已设置 ✓' : '未设置，将使用默认值');

// 如果API密钥未设置，则退出
if (!process.env.KIMI_API_KEY) {
  console.error('\n错误: 未设置KIMI_API_KEY环境变量');
  console.error('请设置环境变量: export KIMI_API_KEY=\'your-api-key\'');
  process.exit(1);
}

// 创建OpenAI客户端
const client = new OpenAI({
  apiKey: process.env.KIMI_API_KEY,
  baseURL: process.env.KIMI_BASE_URL || 'https://aiproxy.hzh.sealos.run/v1'
});

// 测试简单请求
async function testKimiAPI() {
  console.log('\n测试Kimi API连接...');
  
  try {
    // 发送简单的聊天请求
    const completion = await client.chat.completions.create({
      model: process.env.KIMI_MODEL || 'moonshot-v1-32k',
      messages: [
        { role: 'system', content: '你是Kimi，由Moonshot AI提供的人工智能助手。' },
        { role: 'user', content: '你好，请简单介绍一下自己。' }
      ],
      temperature: 0.3,
    });

    console.log('\nKimi API连接成功! ✓');
    console.log('响应内容:');
    console.log(completion.choices[0].message.content);
    
  } catch (error) {
    console.error('\nKimi API连接失败! ✗');
    console.error('错误信息:', error.message);
    
    // 提供更详细的错误信息
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testKimiAPI(); 