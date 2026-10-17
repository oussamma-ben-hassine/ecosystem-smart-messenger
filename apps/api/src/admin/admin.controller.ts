import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('Administration & Santé')
@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  @ApiOperation({ summary: 'État de santé du système et des intégrations écosystème' })
  async getHealth() {
    return this.adminService.getSystemHealth();
  }
}
