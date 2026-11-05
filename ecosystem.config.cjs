module.exports = {
  apps: [
    {
      name: "ossoadmin",
      cwd: "/var/www/ossoadmin",
      script: "npm",
      args: "run start -- -p 3001 -H 127.0.0.1",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "600M",
      env_production: { NODE_ENV: "production" },
    },
  ],
};
