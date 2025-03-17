#!/usr/bin/env node

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { createInterface as createReadlineInterface } from 'readline';

// 创建用户输入接口
const userInput = createReadlineInterface({
  input: process.stdin,
  output: process.stdout
});

// 启动MCP服务器
console.log("启动Kimi MCP服务器...");
const mcpServer = spawn('node', ['index.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// 创建readline接口，用于读取MCP服务器的输出
const rl = createInterface({
  input: mcpServer.stdout,
  crlfDelay: Infinity
});

// 处理MCP服务器的输出
let toolsInfo = null;
rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    
    // 处理工具列表响应
    if (response.id === "list_tools" && response.result && response.result.tools) {
      toolsInfo = response.result.tools;
      console.log("\n可用工具:");
      toolsInfo.forEach(tool => {
        console.log(`- ${tool.name}: ${tool.description}`);
      });
      promptUser();
    }
    
    // 处理搜索响应
    if (response.id === "search") {
      console.log("\n搜索结果:");
      if (response.result && response.result.content) {
        response.result.content.forEach(item => {
          if (item.type === "text") {
            try {
              // 尝试解析JSON
              const content = JSON.parse(item.text);
              console.log("内容类型: 结构化数据");
              console.log(JSON.stringify(content, null, 2));
            } catch (e) {
              // 纯文本
              console.log("内容类型: 纯文本");
              console.log(item.text);
            }
          }
        });
      }
      promptUser();
    }
  } catch (error) {
    // 忽略非JSON输出
  }
});

// 发送工具列表请求
function requestToolsList() {
  const listToolsRequest = {
    jsonrpc: "2.0",
    id: "list_tools",
    method: "mcp.list_tools",
    params: {}
  };
  mcpServer.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}

// 发送搜索请求
function performSearch(query) {
  console.log(`\n模拟Claude分析用户查询: "${query}"`);
  console.log("Claude正在构建适当的搜索参数...");
  
  // 模拟Claude的思考过程
  let role = "你是Kimi，由Moonshot AI提供的人工智能助手";
  let responseFormat = null;
  
  // 根据查询内容调整角色和响应格式
  if (query.includes("技术") || query.includes("AI") || query.includes("人工智能")) {
    role = "你是一位AI技术专家，请提供专业的搜索结果和分析";
    responseFormat = "请以markdown格式返回，包含标题、链接和简短描述，重点关注最新的技术发展和应用";
    console.log("检测到技术相关查询，使用技术专家角色");
  } else if (query.includes("医疗") || query.includes("健康")) {
    role = "你是一位医疗健康领域的专家，请提供专业的医学信息";
    responseFormat = "请以结构化方式返回信息，包含研究发现、临床应用和注意事项，确保信息准确可靠";
    console.log("检测到医疗相关查询，使用医疗专家角色");
  } else if (query.includes("历史") || query.includes("文化")) {
    role = "你是一位历史学者，请提供深入的历史和文化分析";
    responseFormat = "请以叙事方式返回信息，包含历史背景、文化意义和不同观点";
    console.log("检测到历史文化相关查询，使用历史学者角色");
  }
  
  console.log(`选择角色: ${role}`);
  if (responseFormat) {
    console.log("自定义返回格式");
  } else {
    console.log("使用默认JSON返回格式");
  }
  
  // 构建搜索请求
  const searchRequest = {
    jsonrpc: "2.0",
    id: "search",
    method: "mcp.call_tool",
    params: {
      name: "search",
      arguments: {
        query: query,
        role: role
      }
    }
  };
  
  // 添加响应格式（如果有）
  if (responseFormat) {
    searchRequest.params.arguments.responseFormat = responseFormat;
  }
  
  console.log("\n发送MCP请求:");
  console.log(JSON.stringify(searchRequest, null, 2));
  
  // 发送请求
  mcpServer.stdin.write(JSON.stringify(searchRequest) + '\n');
}

// 提示用户输入
function promptUser() {
  userInput.question("\n请输入搜索查询 (输入'exit'退出): ", (query) => {
    if (query.toLowerCase() === 'exit') {
      console.log("退出程序...");
      mcpServer.kill();
      process.exit(0);
    } else if (query.toLowerCase() === 'tools') {
      requestToolsList();
    } else {
      performSearch(query);
    }
  });
}

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

// 开始测试
console.log("模拟Claude使用MCP协议与Kimi搜索服务交互");
console.log("输入'tools'查看可用工具");
console.log("输入'exit'退出程序");
requestToolsList(); 