import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  private readonly BUCKET = 'categories';

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  /* ─── helpers ──────────────────────────────────── */

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let slug = this.slugify(name);
    let counter = 0;
    while (
      await this.prisma.category.findUnique({ where: { slug } })
    ) {
      counter++;
      slug = `${this.slugify(name)}-${counter}`;
    }
    return slug;
  }

  /* ─── CRUD ────────────────────────────────────── */

  async create(
    dto: CreateCategoryDto,
    image?: Express.Multer.File,
  ) {
    // Validate 2-level tree: parentId cannot have a parent itself
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId, deletedAt: null },
      });
      if (!parent) throw new NotFoundException('Danh mục cha không tồn tại');
      if (parent.parentId)
        throw new BadRequestException('Chỉ hỗ trợ cây danh mục 2 cấp');
    }

    const slug = await this.generateUniqueSlug(dto.name);
    let imageUrl: string | undefined;

    if (image) {
      imageUrl = await this.storage.upload(this.BUCKET, image);
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        parentId: dto.parentId || null,
        sortOrder: dto.sortOrder ?? 0,
        imageUrl,
      },
      include: { children: true },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      where: { deletedAt: null, parentId: null },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category || category.deletedAt)
      throw new NotFoundException('Danh mục không tồn tại');

    return category;
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
    image?: Express.Multer.File,
  ) {
    const existing = await this.findOne(id);

    // Validate 2-level tree if changing parent
    if (dto.parentId && dto.parentId !== existing.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId, deletedAt: null },
      });
      if (!parent) throw new NotFoundException('Danh mục cha không tồn tại');
      if (parent.parentId)
        throw new BadRequestException('Chỉ hỗ trợ cây danh mục 2 cấp');
    }

    let imageUrl = existing.imageUrl;
    if (image) {
      // Delete old image if exists
      if (existing.imageUrl) {
        await this.storage.delete(this.BUCKET, existing.imageUrl);
      }
      imageUrl = await this.storage.upload(this.BUCKET, image);
    }

    const slug = dto.name
      ? await this.generateUniqueSlug(dto.name)
      : existing.slug;

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        parentId: dto.parentId || null,
        sortOrder: dto.sortOrder,
        imageUrl,
      },
      include: { children: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete: also soft-delete children
    await this.prisma.category.updateMany({
      where: { parentId: id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
