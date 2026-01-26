const fs = require('fs');
const path = require('path');

const appName = process.argv[2];
const moduleName = process.argv[3];

if (!appName || !moduleName) {
  console.error('Usage: npm run generate:module <app-name> <module-name>');
  console.error('Example: npm run generate:module auth-service users');
  process.exit(1);
}

// Convert kebab-case to PascalCase
const toPascalCase = (str) =>
  str.replace(/(^\w|-\w)/g, (clear) => clear.replace('-', '').toUpperCase());

// Convert kebab-case to camelCase
const toCamelCase = (str) =>
  str.replace(/-\w/g, (clear) => clear.replace('-', '').toUpperCase());

const pascalName = toPascalCase(moduleName);
const camelName = toCamelCase(moduleName);

// Target base directory: apps/<app-name>/src/<module-name>
const baseDir = path.join(__dirname, '..', 'apps', appName, 'src', moduleName);
const dirs = [
  'controllers',
  'services',
  'entities',
  'dto',
  'guards',
  'decorators',
  'interfaces',
];

// 1. Create Directories
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
  console.log(`Created module directory: ${baseDir}`);
}

dirs.forEach((dir) => {
  const dirPath = path.join(baseDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
    console.log(`Created directory: ${dirPath}`);
  }
});

// 2. Generate Files

// -- Module File --
const moduleContent = `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ${pascalName}Controller } from './controllers/${moduleName}.controller';
import { ${pascalName}Service } from './services/${moduleName}.service';
import { ${pascalName} } from './entities/${moduleName}.entity';

@Module({
  imports: [TypeOrmModule.forFeature([${pascalName}])],
  controllers: [${pascalName}Controller],
  providers: [${pascalName}Service],
  exports: [${pascalName}Service],
})
export class ${pascalName}Module {}
`;

// -- Controller --
const controllerContent = `import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ${pascalName}Service } from '../services/${moduleName}.service';
import { Create${pascalName}Dto } from '../dto/create-${moduleName}.dto';
import { Update${pascalName}Dto } from '../dto/update-${moduleName}.dto';

@ApiTags('${pascalName}')
@Controller('${moduleName}')
export class ${pascalName}Controller {
  constructor(private readonly service: ${pascalName}Service) {}

  @Post()
  @ApiOperation({ summary: 'Create ${pascalName}' })
  create(@Body() createDto: Create${pascalName}Dto) {
    return this.service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all ${moduleName}' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ${pascalName} by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ${pascalName}' })
  update(@Param('id') id: string, @Body() updateDto: Update${pascalName}Dto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ${pascalName}' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
`;

// -- Service --
const serviceContent = `import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ${pascalName} } from '../entities/${moduleName}.entity';
import { Create${pascalName}Dto } from '../dto/create-${moduleName}.dto';
import { Update${pascalName}Dto } from '../dto/update-${moduleName}.dto';

@Injectable()
export class ${pascalName}Service {
  constructor(
    @InjectRepository(${pascalName})
    private readonly repository: Repository<${pascalName}>,
  ) {}

  create(createDto: Create${pascalName}Dto) {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  findAll() {
    return this.repository.find();
  }

  async findOne(id: string) {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('${pascalName} not found');
    return entity;
  }

  async update(id: string, updateDto: Update${pascalName}Dto) {
    const entity = await this.findOne(id);
    Object.assign(entity, updateDto);
    return this.repository.save(entity);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    return this.repository.remove(entity);
  }
}
`;

// -- Entity --
const entityContent = `import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('${moduleName}')
export class ${pascalName} {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
`;

// -- DTOs --
const createDtoContent = `import { ApiProperty } from '@nestjs/swagger';

export class Create${pascalName}Dto {
  // @ApiProperty()
  // name: string;
}
`;

const updateDtoContent = `import { PartialType } from '@nestjs/swagger';
import { Create${pascalName}Dto } from './create-${moduleName}.dto';

export class Update${pascalName}Dto extends PartialType(Create${pascalName}Dto) {}
`;

// Helper: Write file
const writeFile = (filePath, content) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`Generated: ${filePath}`);
  } else {
    console.log(`Skipped (exists): ${filePath}`);
  }
};

writeFile(path.join(baseDir, `${moduleName}.module.ts`), moduleContent);
writeFile(path.join(baseDir, 'controllers', `${moduleName}.controller.ts`), controllerContent);
writeFile(path.join(baseDir, 'services', `${moduleName}.service.ts`), serviceContent);
writeFile(path.join(baseDir, 'entities', `${moduleName}.entity.ts`), entityContent);
writeFile(path.join(baseDir, 'dto', `create-${moduleName}.dto.ts`), createDtoContent);
writeFile(path.join(baseDir, 'dto', `update-${moduleName}.dto.ts`), updateDtoContent);

console.log('\n✅ Module generated successfully!');
