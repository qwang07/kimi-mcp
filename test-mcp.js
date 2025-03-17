#!/usr/bin/env node

import { spawn } from 'child_process';
import { createInterface } from 'readline';

// MCP请求
const LIST_TOOLS_REQUEST = {
  jsonrpc: "2.0",
  id: "1",
  method: "tools/list",
  params: {}
};

const SEARCH_REQUEST = {
  jsonrpc: "2.0",
  id: "2",
  method: "tools/call",
  params: {
    name: "search",
    arguments: {
      query: "2024年人工智能发展趋势",
      role: "你是一位AI技术专家，请提供专业的搜索结果和分析",
      responseFormat: "请以markdown格式返回，包含标题、链接和简短描述"
    }
  }
};

// 启动MCP服务器
console.log("启动MCP服务器...");
const mcpServer = spawn('node', ['index.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// 创建readline接口，用于读取MCP服务器的输出
const rl = createInterface({
  input: mcpServer.stdout,
  crlfDelay: Infinity
});

// 处理MCP服务器的输出
let responses = [];
rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    responses.push(response);
    console.log("收到响应:", JSON.stringify(response, null, 2));
    
    // 如果收到了搜索请求的响应，则退出
    if (response.id === "2") {
      console.log("测试完成，退出...");
      mcpServer.kill();
      process.exit(0);
    }
  } catch (error) {
    console.error("解析响应失败:", line);
  }
});

// 发送请求
console.log("发送工具列表请求...");
mcpServer.stdin.write(JSON.stringify(LIST_TOOLS_REQUEST) + '\n');

// 等待一段时间后发送搜索请求
setTimeout(() => {
  console.log("发送搜索请求...");
  mcpServer.stdin.write(JSON.stringify(SEARCH_REQUEST) + '\n');
}, 1000);

// 处理错误
mcpServer.on('error', (error) => {
  console.error("MCP服务器错误:", error);
  process.exit(1);
});

// 处理退出
mcpServer.on('exit', (code) => {
  console.log(`MCP服务器退出，退出码: ${code}`);
  process.exit(code);
});

// 处理进程信号
process.on('SIGINT', () => {
  console.log("收到中断信号，退出...");
  mcpServer.kill();
  process.exit(0);
});