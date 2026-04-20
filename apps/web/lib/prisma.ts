// apps/web/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma // <--- THIS IS THE "MODULE" PART

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma