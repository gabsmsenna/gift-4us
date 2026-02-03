import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { GroupInvite } from './entities/group-invite.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GroupInvite])],
  controllers: [InvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}