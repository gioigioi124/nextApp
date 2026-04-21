import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto, ProductSortEnum } from './dto/query-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  private readonly BUCKET = 'products';

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
    while (await this.prisma.product.findUnique({ where: { slug } })) {
      counter++;
      slug = `${this.slugify(name)}-${counter}`;
    }
    return slug;
  }

  private parseVariants(raw?: string) {
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) throw new Error();
      return arr.map((v: any) => ({
        name: v.name,
        sku: v.sku || null,
        price: Number(v.price),
        stock: Number(v.stock ?? 0),
        attributes:
          typeof v.attributes === 'string'
            ? JSON.parse(v.attributes)
            : v.attributes ?? {},
      }));
    } catch {
      throw new BadRequestException(
        'variants phải là JSON array hợp lệ',
      );
    }
  }

  private readonly defaultInclude = {
    category: true,
    images: { orderBy: { sortOrder: 'asc' as const } },
    variants: true,
  };

  /* ─── CREATE ───────────────────────────────────── */

  async create(
    dto: CreateProductDto,
    images?: Express.Multer.File[],
  ) {
    console.log(`Creating product: ${dto.name}, images received: ${images?.length || 0}`);
    // Validate category exists
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId, deletedAt: null },
    });
    if (!category)
      throw new NotFoundException('Danh mục không tồn tại');

    const slug = await this.generateUniqueSlug(dto.name);
    const variants = this.parseVariants(dto.variants);

    // Upload images to Supabase
    let imageUrls: string[] = [];
    if (images?.length) {
      imageUrls = await this.storage.uploadMany(
        this.BUCKET,
        images,
      );
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        basePrice: dto.basePrice,
        comparePrice: dto.comparePrice,
        sku: dto.sku,
        stock: dto.stock,
        isPublished: dto.isPublished ?? false,
        categoryId: dto.categoryId,
        images: {
          create: imageUrls.map((url, i) => ({
            url,
            sortOrder: i,
          })),
        },
        variants: {
          create: variants,
        },
      },
      include: this.defaultInclude,
    });
  }

  /* ─── READ (public) ────────────────────────────── */

  async findAll(query: QueryProductDto) {
    const { page = 1, limit = 20, search, categoryId, minPrice, maxPrice, sort } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      isPublished: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    switch (sort) {
      case ProductSortEnum.PRICE_ASC:
        orderBy = { basePrice: 'asc' };
        break;
      case ProductSortEnum.PRICE_DESC:
        orderBy = { basePrice: 'desc' };
        break;
      case ProductSortEnum.BEST_SELLER:
        orderBy = { sold: 'desc' };
        break;
      case ProductSortEnum.NEWEST:
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: this.defaultInclude,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: this.defaultInclude,
    });

    if (!product || product.deletedAt)
      throw new NotFoundException('Sản phẩm không tồn tại');

    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: this.defaultInclude,
    });

    if (!product || product.deletedAt)
      throw new NotFoundException('Sản phẩm không tồn tại');

    return product;
  }

  /* ─── ADMIN: findAll without publish filter ──── */

  async adminFindAll(query: QueryProductDto) {
    const { page = 1, limit = 20, search, categoryId, sort } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    switch (sort) {
      case ProductSortEnum.PRICE_ASC:
        orderBy = { basePrice: 'asc' };
        break;
      case ProductSortEnum.PRICE_DESC:
        orderBy = { basePrice: 'desc' };
        break;
      case ProductSortEnum.BEST_SELLER:
        orderBy = { sold: 'desc' };
        break;
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: this.defaultInclude,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ─── UPDATE ───────────────────────────────────── */

  async update(
    id: string,
    dto: UpdateProductDto,
    images?: Express.Multer.File[],
  ) {
    console.log(`Updating product: ${id}, images received: ${images?.length || 0}`);
    const existing = await this.findOne(id);

    const slug =
      dto.name && dto.name !== existing.name
        ? await this.generateUniqueSlug(dto.name)
        : existing.slug;

    // Handle new images: upload and append
    let newImageRecords: { url: string; sortOrder: number }[] = [];
    if (images?.length) {
      const urls = await this.storage.uploadMany(this.BUCKET, images);
      const lastSort = existing.images.length;
      newImageRecords = urls.map((url, i) => ({
        url,
        sortOrder: lastSort + i,
      }));
    }

    // Handle variants: replace all if provided
    const variants = dto.variants ? this.parseVariants(dto.variants) : null;

    return this.prisma.$transaction(async (tx) => {
      // Replace variants if new ones provided
      if (variants) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        await tx.productVariant.createMany({
          data: variants.map((v) => ({ ...v, productId: id })),
        });
      }

      // Add new images
      if (newImageRecords.length) {
        await tx.productImage.createMany({
          data: newImageRecords.map((img) => ({
            ...img,
            productId: id,
          })),
        });
      }

      return tx.product.update({
        where: { id },
        data: {
          name: dto.name,
          slug,
          description: dto.description,
          basePrice: dto.basePrice,
          comparePrice: dto.comparePrice,
          sku: dto.sku,
          stock: dto.stock,
          isPublished: dto.isPublished,
          categoryId: dto.categoryId,
        },
        include: this.defaultInclude,
      });
    });
  }

  /* ─── DELETE IMAGE ─────────────────────────────── */

  async removeImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) throw new NotFoundException('Ảnh không tồn tại');

    await this.storage.delete(this.BUCKET, image.url);
    await this.prisma.productImage.delete({ where: { id: imageId } });

    return { deleted: true };
  }

  /* ─── SOFT DELETE ──────────────────────────────── */

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
