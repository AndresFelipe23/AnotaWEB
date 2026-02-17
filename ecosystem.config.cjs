// ecosystem.config.cjs - Configuración PM2 para Anota API (ASP.NET Core)
// Extensión .cjs para CommonJS (proyecto tiene "type": "module" en package.json)

module.exports = {
  apps: [
    {
      name: 'anota-api',
      script: '/bin/sh',
      args: '-c "dotnet run --project NotasApi"',
      cwd: '/cloudclusters/Anota',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        ASPNETCORE_ENVIRONMENT: 'Development',
        ASPNETCORE_URLS: 'http://0.0.0.0:8080',
        TZ: 'America/Bogota',
      },
      env_production: {
        NODE_ENV: 'production',
        ASPNETCORE_ENVIRONMENT: 'Production',
        ASPNETCORE_URLS: 'http://0.0.0.0:8080',
        TZ: 'America/Bogota',
      },
      error_file: '/cloudclusters/Anota/logs/pm2-error.log',
      out_file: '/cloudclusters/Anota/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      kill_timeout: 10000,
      listen_timeout: 15000,
      exp_backoff_restart_delay: 100,
    },
  ],

  deploy: {
    production: {
      user: 'root',
      host: 'anota.click',
      ref: 'origin/main',
      repo: 'git@github.com:TU-USUARIO/Anota.git',
      path: '/cloudclusters/Anota',
      'pre-deploy-local': '',
      'post-deploy': 'cd NotasApi && dotnet publish -c Release -o ./publish && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': 'mkdir -p logs',
      ssh_options: 'StrictHostKeyChecking=no',
    },
  },
};
