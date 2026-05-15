module.exports = {
  apps: [
    {
      name: 'teach-advisor',
      script: './index.js',
      cwd: '/home/songon/TeachAdvisor',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        BASE_PATH: '/teachAdvisor',
        // ADMIN_PASSWORD et SESSION_SECRET sont lus depuis .env via dotenv
      },
    },
  ],
};