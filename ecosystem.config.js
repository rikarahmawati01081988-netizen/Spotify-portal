module.exports = {
  apps: [
    {
      name: "customer-002",
      script: "bot.development.js",
      args: '"customer 002"',
      cwd: "/data/data/com.termux/files/home/wa-bot",
      env: {
        DEV_SESSION_DIR: "./development-sessions/customer 002"
      },
      restart_delay: 10000,
      max_restarts: 5
    }
  ]
}
