import { ArrowDown, ArrowUp, Clock, Activity, Wifi, ShieldAlert, type LucideIcon } from 'lucide-react'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { Flag } from './Flag'
import { MiniTcpingPanel } from './MiniTcpingPanel'
import { ResourceRing } from './ResourceRing'
import { StatusDot } from './StatusDot'
import { bytes, relativeAge, uptime } from '../utils/format'
import { cpuLabel, deriveUsage, displayName, distroLogo, osLabel, virtLabel } from '../utils/derive'
import { cn } from '../utils/cn'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { useInViewport } from '../hooks/useInViewport'
import { useNodeTcpLatency } from '../hooks/useNodeTcpLatency'
import type { BackendPool } from '../api/pool'
import type { Node } from '../types'
import { nodeKey } from '../utils/nodeKey'
import type { ReactNode } from 'react'

export function NodeCard({ node, pool }: { node: Node; pool: BackendPool | null }) {
  const u = deriveUsage(node)
  const tags = Array.isArray(node.meta?.tags) ? node.meta.tags : []
  const os = osLabel(node)
  const logo = distroLogo(node)
  const virt = virtLabel(node)
  const cpu = cpuLabel(node)
  const { ref, visible } = useInViewport<HTMLAnchorElement>({ rootMargin: '320px 0px' })
  const { tcpData, loading: tcpLoading, error: tcpError } = useNodeTcpLatency(pool, node.source, node.uuid, {
    enabled: visible && node.online,
    refreshMs: 180_000,
    priority: visible ? 'high' : 'normal',
  })

  // === 计算延迟 (Ping) 和 丢包率 (Packet Loss) ===
  const totalRequests = tcpData?.length || 0
  const failedRequests = tcpData?.filter(d => !d.success).length || 0
  const lossRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0
  
  const successfulRequests = tcpData?.filter(d => d.success) || []
  let avgPing = 0
  if (successfulRequests.length > 0) {
    const totalPing = successfulRequests.reduce((acc, curr) => {
      // 兼容解析 NodeGet API 返回的延迟结果
      const res = curr.task_event_result as any
      const ping = res?.rtt ?? res?.delay ?? res?.ping ?? res?.time ?? (typeof res === 'number' ? res : 0)
      return acc + ping
    }, 0)
    avgPing = totalPing / successfulRequests.length
  }

  return (
    <a ref={ref} href={`#${encodeURIComponent(nodeKey(node))}`} className="block h-full outline-none">
      <Card
        className={cn(
          'group relative h-full min-h-[360px] sm:min-h-[430px] p-4 sm:p-5 flex flex-col gap-3.5 sm:gap-4 overflow-hidden',
          'transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]', // 更平滑的过渡动画
          'hover:border-primary/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1', // 悬浮抬起与阴影
          'dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.05)] bg-card',
          !node.online && 'opacity-75 grayscale-[0.2]'
        )}
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center gap-3 border-b border-dashed border-border/60 pb-3 transition-colors group-hover:border-primary/30">
          <StatusDot online={node.online} />
          {logo && (
            <img 
              src={logo} 
              alt="OS Logo" 
              className="h-6 w-6 shrink-0 rounded-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110" 
              loading="lazy" 
            />
          )}
          <div className="min-w-0 flex-1 flex flex-col">
            <span className="truncate text-[15px] sm:text-[16px] font-black tracking-wide text-foreground transition-colors group-hover:text-primary" title={displayName(node)}>
              {displayName(node)}
            </span>
            {(os || virt) && (
              <span className="truncate text-[11px] font-medium text-muted-foreground/80 mt-0.5">
                {[os, virt].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
          <Flag code={node.meta?.region} className="shrink-0 drop-shadow-sm transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110" />
        </div>

        {/* 环形资源进度条 */}
        <div className="grid grid-cols-3 gap-x-2 gap-y-3 py-2 sm:gap-3">
          <ResourceRing 
            label="CPU" 
            value={u.cpu} 
            sub={cpu || null} 
            subTitle={cpu || undefined} 
            size={86} 
            strokeWidth={9} 
          />
          <ResourceRing
            label="内存"
            value={u.mem}
            sub={u.memTotal ? `${bytes(u.memUsed)} / ${bytes(u.memTotal)}` : null}
            size={86}
            strokeWidth={9}
          />
          <ResourceRing
            label="磁盘"
            value={u.disk}
            sub={u.diskTotal ? `${bytes(u.diskUsed)} / ${bytes(u.diskTotal)}` : null}
            size={86}
            strokeWidth={9}
          />
        </div>

        {/* 延迟与丢包率面板 */}
        <div className="grid grid-cols-3 gap-2 bg-secondary/40 rounded-xl p-2.5 border border-border/30 backdrop-blur-sm transition-colors group-hover:bg-secondary/60">
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
              <Activity className="w-3 h-3" /> 延迟
            </span>
            <span className={cn(
              "font-mono text-xs font-bold",
              avgPing > 0 ? (avgPing > 200 ? 'text-amber-500' : 'text-green-500') : 'text-muted-foreground'
            )}>
              {avgPing > 0 ? `${avgPing.toFixed(1)} ms` : '--'}
            </span>
          </div>
          
          <div className="flex flex-col items-center justify-center gap-1 border-x border-border/50">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
              <ShieldAlert className="w-3 h-3" /> 丢包率
            </span>
            <span className={cn(
              "font-mono text-xs font-bold",
              lossRate === 0 ? 'text-green-500' : (lossRate > 10 ? 'text-destructive' : 'text-amber-500')
            )}>
              {totalRequests > 0 ? `${lossRate.toFixed(1)}%` : '--'}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3" /> 运行
            </span>
            <span className="font-mono text-xs font-bold text-foreground">
              {uptime(u.uptime)}
            </span>
          </div>
        </div>

        {/* 迷你图表展示区域 */}
        <div className="opacity-80 transition-opacity duration-300 group-hover:opacity-100">
           <MiniTcpingPanel node={node} tcpData={tcpData} loading={tcpLoading} error={tcpError} />
        </div>

        {/* 底部速度及更新时间栏 */}
        <div className="mt-auto flex flex-col gap-2 border-t border-dashed border-border/60 pt-3 transition-colors group-hover:border-primary/30">
          <div className="flex items-center justify-between font-mono text-[11px] sm:text-xs">
            <AnimatedSpeedStat icon={ArrowDown} value={u.netIn || 0} type="in" />
            <AnimatedSpeedStat icon={ArrowUp} value={u.netOut || 0} type="out" />
          </div>
          
          <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 3).map(t => (
                  <Badge key={t} variant="outline" className="rounded-md border-border/50 bg-background px-1.5 py-0 text-[9px] font-bold text-muted-foreground/80">
                    {t}
                  </Badge>
                ))}
                {tags.length > 3 && <span className="text-muted-foreground/50 text-[9px]">+{tags.length - 3}</span>}
              </div>
            ) : (
              <span />
            )}
            <span className="text-muted-foreground/60 transition-colors group-hover:text-primary/70">
              更新于 {relativeAge(u.ts)}
            </span>
          </div>
        </div>
      </Card>
    </a>
  )
}

function AnimatedSpeedStat({ icon: Icon, value, type }: { icon: LucideIcon; value: number, type: 'in' | 'out' }) {
  const animated = useAnimatedNumber(value || 0, 950)
  
  // 针对上传和下载采用不同的颜色标识，更易区分
  const baseColor = type === 'in' ? 'text-emerald-500' : 'text-blue-500'
  
  const tone = animated.animating
    ? animated.trend === 'up'
      ? baseColor
      : 'text-amber-500'
    : 'text-muted-foreground'

  return (
    <span className={cn('inline-flex items-center gap-1.5 transition-colors duration-300 font-semibold', tone)}>
      <div className={cn("p-1 rounded-full bg-secondary/50", animated.animating && "animate-pulse")}>
        <Icon className="h-3 w-3" />
      </div>
      <span className="w-16 truncate">{bytes(animated.value)}/s</span>
    </span>
  )
}
