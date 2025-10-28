# boilerplate-hono-prisma

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.22. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.


bun init -y

# Runtime
bun add hono zod @prisma/client tsyringe reflect-metadata pino pino-pretty croner

# Dev
bun add -d typescript @types/node prisma

bunx prisma init --datasource-provider postgresql

bun run prisma:gen
bun run prisma:migrate --name init

run using git bash 
mkdir -p src/{config,core/{middleware,di,utils},infrastructure/prisma,jobs,modules/user/{dto,commands,services,repositories,strategies}}
