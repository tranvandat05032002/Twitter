import fs from "fs"
import path from "path"
import yaml from "js-yaml"

interface RedisNode {
  host: string;
  port: number;
}
interface AppConfig {
  cache?: {
    ttl?: number;
    enabled: boolean;
    master: RedisNode;
    slave: RedisNode;
  };
  elastic?: {
    host: string;
    port: number;
    username: string;
    password: string;
    max_retry: number;
    request_timeout: number;
  };
}

function getConfig(): AppConfig | null {
  try {
    const absolutePath = path.resolve(__dirname, '..', './config/config.yml');
    const fileContents = fs.readFileSync(absolutePath, 'utf8');
    return yaml.load(fileContents) as AppConfig
  } catch (error) {
    console.error(`❌ Lỗi khi đọc file YAML:`)
    return null
  }
}

// Redis
export default function getRedisTTL() {
  const config = getConfig()
  return config?.cache?.ttl || 600
}

export function getRedisMaster() {
  const config = getConfig()
  return config?.cache?.master
}

export function getRedisSlave() {
  const config = getConfig()
  return config?.cache?.slave
}

export function getModeRedis() {
  const config = getConfig()
  return config?.cache?.enabled
}

// Elasticsearch
export function getESHost() {
  const config = getConfig()
  return config?.elastic?.host
}

export function getESPort() {
  const config = getConfig()
  return config?.elastic?.port
}

export function getESUserName() {
  const config = getConfig()
  return config?.elastic?.username
}

export function getESPassword() {
  const config = getConfig()
  return config?.elastic?.password
}

export function getESRetry() {
  const config = getConfig()
  return config?.elastic?.max_retry
}
export function getESTimeout() {
  const config = getConfig()
  return config?.elastic?.request_timeout
}

export function getESNode() {
  return `http://${getESHost()}:${getESPort()}`
}