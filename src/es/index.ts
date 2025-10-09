import { Client } from "@elastic/elasticsearch"
import { getESNode, getESPassword, getESRetry, getESTimeout, getESUserName } from "~/utils/yaml"
export const esClient = new Client({
  node: getESNode(),
  auth: {
    username: getESUserName() || "elastic",
    password: getESPassword() as string
  },
  maxRetries: getESRetry(),
  requestTimeout: getESTimeout()
})

export async function checkElasticsearch() {
  try {
    await esClient.ping();
    console.log("✅ Elasticsearch running at " + getESNode())
    const info = await esClient.info();
    console.log(`📦 Cluster: ${info.cluster_name} | Version: ${info.version?.number}`);
    return true;
  } catch (err) {
    console.error("❌ Elasticsearch connect failed:", err)
    return false;
  }
}