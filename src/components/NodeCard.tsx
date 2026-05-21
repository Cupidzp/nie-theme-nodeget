import React from 'react';
// 请确保这里的路径和你的实际类型定义相匹配
import { type NodeStatus } from '../types';
import { cn } from '../utils/cn'; 

interface NodeCardProps {
  node: NodeStatus;
}

export const NodeCard: React.FC<NodeCardProps> = ({ node }) => {
  // 根据 NodeGet 的 API 数据结构，解构你需要的字段
  const { name, online, location, cpu = 0, memory, disk, ping } = node;

  const memPercent = memory?.total ? ((memory.used / memory.total) * 100) : 0;
  const diskPercent = disk?.total ? ((disk.used / disk.total) * 100) : 0;

  return (
    <div 
      className={cn(
        "group relative bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800",
        "rounded-xl p-5 overflow-hidden",
        // 卡片过渡细节：轻微上浮 + 阴影变化，持续 300ms
        "transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl"
      )}
    >
      {/* 头部：节点名称与状态 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-2">
          {location?.flag && <span className="text-xl">{location.flag}</span>}
          <h3 className="font-medium text-gray-900 dark:text-gray-100 tracking-wide">
            {name || 'Unknown Node'}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {/* 在线状态指示灯（带呼吸脉冲动画） */}
          <span className="relative flex h-2.5 w-2.5">
            {online && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black dark:bg-white opacity-40"></span>
            )}
            <span className={cn(
              "relative inline-flex rounded-full h-2.5 w-2.5",
              online ? "bg-black dark:bg-white" : "bg-gray-300 dark:bg-gray-700"
            )}></span>
          </span>
          <span className="text-xs text-gray-500 font-mono">
            {online ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* 延迟与丢包率区域 */}
      <div className="flex items-center justify-between mb-5 bg-gray-50 dark:bg-[#111] p-3 rounded-lg transition-colors duration-300">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Latency</span>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-mono">
            {ping?.latency !== undefined ? `${ping.latency} ms` : '-- ms'}
          </span>
        </div>
        {/* 分割线 */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-800"></div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Packet Loss</span>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-mono">
            {ping?.loss !== undefined ? `${ping.loss}%` : '--%'}
          </span>
        </div>
      </div>

      {/* 资源进度条区域 */}
      <div className="space-y-3.5">
        <ProgressBar label="CPU" percentage={cpu} />
        <ProgressBar label="RAM" percentage={memPercent} />
        <ProgressBar label="DISK" percentage={diskPercent} />
      </div>
    </div>
  );
};

// 提取进度条组件，保持代码整洁并集中控制过渡动画
const ProgressBar = ({ label, percentage }: { label: string; percentage: number }) => {
  const safePercent = Math.min(Math.max(percentage || 0, 0), 100);
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-mono">
        <span>{label}</span>
        <span>{safePercent.toFixed(1)}%</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
        <div 
          // 数据更新时的过渡动画：duration-700 控制进度条宽度丝滑变化
          className="h-full bg-black dark:bg-white rounded-full transition-all duration-700 ease-in-out"
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  );
};
