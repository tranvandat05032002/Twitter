export function normalizeIp(ip: string): string {
  if (!ip) return ''
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return '127.0.0.1'
  const m = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)
  const ipv4mapped = m ? m[1] : ip
  return ipv4mapped.split('%')[0].replace(/^\[?([^\]]+)\]?(:\d+)?$/, '$1')
}