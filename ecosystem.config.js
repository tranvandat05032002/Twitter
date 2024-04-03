// eslint-disable-next-line no-undef
module.exports = {
  apps: [
    {
      name: 'Twitter-API',
      script: 'node dist/index.js',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
}
