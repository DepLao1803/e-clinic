import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() { return this.prisma.role.findMany({ orderBy: { id: 'asc' } }); }

  /** Accepts a transaction client so registration stays atomic. */
  findOrCreateByName(name: string, tx: Prisma.TransactionClient | PrismaService = this.prisma) {
    return tx.role.upsert({ where: { name }, update: {}, create: { name } });
  }
}
