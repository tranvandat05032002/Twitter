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

export default function getRedisTTL() {
    const config = getConfig();
    return config?.cache?.ttl || 600
}

export function getRedisMaster() {
    const config = getConfig();
    return config?.cache?.master;
}

export function getRedisSlave() {
    const config = getConfig();
    return config?.cache?.slave;
}

export function getModeRedis() {
    const config = getConfig();
    return config?.cache?.enabled;
}