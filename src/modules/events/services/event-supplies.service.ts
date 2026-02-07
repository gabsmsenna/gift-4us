import { Injectable, Inject, BadRequestException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ClientProxy } from '@nestjs/microservices';
import { EventSupply } from '../entities/event-supply.entity';
import { SupplyContribution } from '../entities/supply-contribution.entity';
import { UserEvent } from '../entities/user-event.entity';
import { EventType } from 'src/util/event.enum';
import { User } from '../../users/entities/user.entity';
import { GroupMember } from '../../groups/entities/group-member.entity';
import { CreateEventSupplyDto } from '../dtos/create-event-supply.dto';
import { UpdateEventSupplyDto } from '../dtos/update-event-supply.dto';
import { CreateSupplyContributionDto } from '../dtos/create-supply-contribution.dto';
import { UpdateSupplyContributionDto } from '../dtos/update-supply-contribution.dto';
import { EventSupplyWithProgressDto } from '../dtos/event-supply-with-progress.dto';
import { EventParticipant } from '../entities/event-participant.entity';

interface ValidationResult {
  isValid: boolean;
  warning?: string;
}

@Injectable()
export class EventSuppliesService {
  private readonly logger = new Logger(EventSuppliesService.name);

  constructor(
    @InjectRepository(EventParticipant)
    private readonly eventParticipantRepository: Repository<EventParticipant>,
    @InjectRepository(EventSupply)
    private readonly eventSupplyRepository: Repository<EventSupply>,
    @InjectRepository(SupplyContribution)
    private readonly supplyContributionRepository: Repository<SupplyContribution>,
    @InjectRepository(UserEvent)
    private readonly userEventRepository: Repository<UserEvent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @Inject('RABBITMQ_SERVICE')
    private readonly rabbitMQClient: ClientProxy,
  ) {}

  // Supply Management methods
  async createSupply(eventId: string, userId: string, dto: CreateEventSupplyDto): Promise<EventSupply> {
    try {
      // Verify user is event owner or group admin
      await this.verifyEventOwnerOrAdmin(eventId, userId);

      // Validate event exists and is REGISTRY or POTLUCK type
      const event = await this.userEventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundException('Evento não encontrado');
      }

      if (event.eventType !== EventType.REGISTRY && event.eventType !== EventType.POTLUCK) {
        throw new BadRequestException(
          'Cadastro de suprimentos só é permitido para eventos do tipo REGISTRY ou POTLUCK',
        );
      }

      // Create and save EventSupply entity
      const supply = this.eventSupplyRepository.create({
        eventId,
        itemName: dto.itemName,
        description: dto.description,
        quantityNeeded: dto.quantityNeeded,
        unit: dto.unit,
        imageUrl: dto.imageUrl,
        url: dto.url,
      });

      const savedSupply = await this.eventSupplyRepository.save(supply);

      await this.invalidateSuppliesCache(eventId);

      return savedSupply;
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException || 
          error instanceof ForbiddenException || 
          error instanceof NotFoundException) {
        throw error;
      }
      
      // Handle TypeORM errors
      if (error instanceof QueryFailedError) {
        this.logger.error(`Database error creating supply: ${error.message}`, error.stack);
        throw new BadRequestException('Erro ao criar suprimento: dados inválidos');
      }
      
      // Log unexpected errors
      this.logger.error(`Unexpected error creating supply: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao criar suprimento');
    }
  }

  async getEventSupplies(eventId: string): Promise<EventSupplyWithProgressDto[]> {
    const cacheKey = this.getCacheKey(eventId);
    
    try {
      // Check cache first using getCacheKey helper
      const cachedData = await this.cacheManager.get<EventSupplyWithProgressDto[]>(cacheKey);

      if (cachedData) {
        return cachedData;
      }
    } catch (cacheError) {
      // Log cache error but continue with database fetch (graceful degradation)
      this.logger.warn(`Cache read failed for ${cacheKey}: ${cacheError.message}`);
    }

    try {
      // If cache miss or cache error, query database with contributions relation
      const supplies = await this.eventSupplyRepository.find({
        where: { eventId },
        relations: ['contributions'],
      });

      // Calculate quantityCommitted and fulfillmentPercentage for each supply
      const suppliesWithProgress: EventSupplyWithProgressDto[] = supplies.map((supply) => {
        // Calculate quantityCommitted by summing contribution quantities
        const quantityCommitted = this.calculateTotalCommitted(supply.contributions || []);

        // Calculate fulfillmentPercentage as (quantityCommitted / quantityNeeded) * 100
        const fulfillmentPercentage = supply.quantityNeeded > 0
          ? Math.round((quantityCommitted / supply.quantityNeeded) * 100)
          : 0;

        return {
          id: supply.id,
          eventId: supply.eventId,
          itemName: supply.itemName,
          description: supply.description,
          quantityNeeded: supply.quantityNeeded,
          unit: supply.unit,
          imageUrl: supply.imageUrl,
          url: supply.url,
          quantityCommitted,
          fulfillmentPercentage,
          createdAt: supply.createdAt,
          updatedAt: supply.updatedAt,
        };
      });

      // Cache results with 2-hour TTL (already configured globally)
      try {
        await this.cacheManager.set(cacheKey, suppliesWithProgress);
      } catch (cacheError) {
        // Log cache write error but don't fail the request
        this.logger.warn(`Cache write failed for ${cacheKey}: ${cacheError.message}`);
      }

      return suppliesWithProgress;
    } catch (error) {
      // Handle TypeORM errors
      if (error instanceof QueryFailedError) {
        this.logger.error(`Database error fetching supplies: ${error.message}`, error.stack);
        throw new BadRequestException('Erro ao buscar suprimentos: problema no banco de dados');
      }
      
      // Log unexpected errors
      this.logger.error(`Unexpected error fetching supplies: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar suprimentos do evento');
    }
  }

  async updateSupply(supplyId: string, userId: string, dto: UpdateEventSupplyDto): Promise<EventSupply> {
    try {
      // Find the supply to get the eventId
      const supply = await this.eventSupplyRepository.findOne({
        where: { id: supplyId },
      });

      if (!supply) {
        throw new NotFoundException('Suprimento não encontrado');
      }

      // Verify user is event owner or group admin
      await this.verifyEventOwnerOrAdmin(supply.eventId, userId);

      // Apply updates to EventSupply entity
      if (dto.itemName !== undefined) supply.itemName = dto.itemName;
      if (dto.description !== undefined) supply.description = dto.description;
      if (dto.quantityNeeded !== undefined) supply.quantityNeeded = dto.quantityNeeded;
      if (dto.unit !== undefined) supply.unit = dto.unit;
      if (dto.imageUrl !== undefined) supply.imageUrl = dto.imageUrl;
      if (dto.url !== undefined) supply.url = dto.url;

      // Save changes
      const updatedSupply = await this.eventSupplyRepository.save(supply);

      // Invalidate cache for event supplies
      await this.invalidateSuppliesCache(supply.eventId);

      return updatedSupply;
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException || 
          error instanceof ForbiddenException || 
          error instanceof NotFoundException) {
        throw error;
      }
      
      // Handle TypeORM errors
      if (error instanceof QueryFailedError) {
        this.logger.error(`Database error updating supply: ${error.message}`, error.stack);
        throw new BadRequestException('Erro ao atualizar suprimento: dados inválidos');
      }
      
      // Log unexpected errors
      this.logger.error(`Unexpected error updating supply: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao atualizar suprimento');
    }
  }

  async deleteSupply(supplyId: string, userId: string): Promise<void> {
    try {
      // Find the supply to get the eventId
      const supply = await this.eventSupplyRepository.findOne({
        where: { id: supplyId },
      });

      if (!supply) {
        throw new NotFoundException('Suprimento não encontrado');
      }

      // Verify user is event owner or group admin
      await this.verifyEventOwnerOrAdmin(supply.eventId, userId);

      // Delete EventSupply (cascade will remove contributions)
      await this.eventSupplyRepository.remove(supply);

      // Invalidate cache for event supplies
      await this.invalidateSuppliesCache(supply.eventId);
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException || 
          error instanceof ForbiddenException || 
          error instanceof NotFoundException) {
        throw error;
      }
      
      // Handle TypeORM errors
      if (error instanceof QueryFailedError) {
        this.logger.error(`Database error deleting supply: ${error.message}`, error.stack);
        throw new BadRequestException('Erro ao deletar suprimento: problema no banco de dados');
      }
      
      // Log unexpected errors
      this.logger.error(`Unexpected error deleting supply: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao deletar suprimento');
    }
  }

  // Contribution Management methods
  async createContribution(
    supplyId: string,
    userId: string,
    dto: CreateSupplyContributionDto,
  ): Promise<SupplyContribution & { warning?: string }> {
    try {
      // Find the supply to get the eventId
      const supply = await this.eventSupplyRepository.findOne({
        where: { id: supplyId },
      });

      if (!supply) {
        throw new NotFoundException('Suprimento não encontrado');
      }

      // Verify user is event participant
      await this.verifyEventParticipant(supply.eventId, userId);

      // Validate contribution quantity
      const validationResult = await this.validateContributionQuantity(
        supplyId,
        dto.quantityCommitted,
      );

      // If over 20% threshold, throw validation error
      if (!validationResult.isValid) {
        throw new BadRequestException(validationResult.warning);
      }

      // Create and save SupplyContribution entity
      const contribution = this.supplyContributionRepository.create({
        supplyId,
        userId,
        quantityCommitted: dto.quantityCommitted,
        notes: dto.notes,
      });

      const savedContribution = await this.supplyContributionRepository.save(contribution);

      // Invalidate cache for event supplies
      await this.invalidateSuppliesCache(supply.eventId);

      // If within 20% threshold, return contribution with warning
      if (validationResult.warning) {
        return {
          ...savedContribution,
          warning: validationResult.warning,
        };
      }

      return savedContribution;
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException || 
          error instanceof ForbiddenException || 
          error instanceof NotFoundException) {
        throw error;
      }
      
      // Handle TypeORM errors
      if (error instanceof QueryFailedError) {
        this.logger.error(`Database error creating contribution: ${error.message}`, error.stack);
        throw new BadRequestException('Erro ao criar contribuição: dados inválidos');
      }
      
      // Log unexpected errors
      this.logger.error(`Unexpected error creating contribution: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao criar contribuição');
    }
  }

  async getSupplyContributions(supplyId: string): Promise<SupplyContribution[]> {
    try {
      // Query SupplyContribution repository with user relation
      const contributions = await this.supplyContributionRepository.find({
        where: { supplyId },
        relations: ['user'],
      });

      // Return all contributions with user information
      return contributions;
    } catch (error) {
      // Handle TypeORM errors
      if (error instanceof QueryFailedError) {
        this.logger.error(`Database error fetching contributions: ${error.message}`, error.stack);
        throw new BadRequestException('Erro ao buscar contribuições: problema no banco de dados');
      }
      
      // Log unexpected errors
      this.logger.error(`Unexpected error fetching contributions: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar contribuições');
    }
  }

  async updateContribution(
    contributionId: string,
    userId: string,
    dto: UpdateSupplyContributionDto,
  ): Promise<SupplyContribution & { warning?: string }> {
    try {
      const contribution = await this.supplyContributionRepository.findOne({
        where: { id: contributionId },
        relations: ['supply'],
      });

      if (!contribution) {
        throw new NotFoundException('Contribuição não encontrada');
      }

      await this.verifyContributionOwner(contributionId, userId);

      // If quantity is being updated, validate new quantity
      let warning: string | undefined;
      if (dto.quantityCommitted !== undefined) {
        const validationResult = await this.validateContributionQuantity(
          contribution.supplyId,
          dto.quantityCommitted,
          contributionId,
        );

        if (!validationResult.isValid) {
          throw new BadRequestException(validationResult.warning);
        }

        warning = validationResult.warning;
        contribution.quantityCommitted = dto.quantityCommitted;
      }

      if (dto.notes !== undefined) {
        contribution.notes = dto.notes;
      }

      const updatedContribution = await this.supplyContributionRepository.save(contribution);

      // Invalidate cache for event supplies
      const supply = await this.eventSupplyRepository.findOne({
        where: { id: contribution.supplyId },
      });
      if (supply) {
        await this.invalidateSuppliesCache(supply.eventId);
      }

      // Return with warning if applicable
      if (warning) {
        return {
          ...updatedContribution,
          warning,
        };
      }

      return updatedContribution;
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException || 
          error instanceof ForbiddenException || 
          error instanceof NotFoundException) {
        throw error;
      }
      
      // Handle TypeORM errors
      if (error instanceof QueryFailedError) {
        this.logger.error(`Database error updating contribution: ${error.message}`, error.stack);
        throw new BadRequestException('Erro ao atualizar contribuição: dados inválidos');
      }
      
      // Log unexpected errors
      this.logger.error(`Unexpected error updating contribution: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao atualizar contribuição');
    }
  }

  async deleteContribution(contributionId: string, userId: string): Promise<void> {
    try {
      // Find the contribution to get the supplyId
      const contribution = await this.supplyContributionRepository.findOne({
        where: { id: contributionId },
      });

      if (!contribution) {
        throw new NotFoundException('Contribuição não encontrada');
      }

      // Verify user owns the contribution
      await this.verifyContributionOwner(contributionId, userId);

      // Get supply to invalidate cache
      const supply = await this.eventSupplyRepository.findOne({
        where: { id: contribution.supplyId },
      });

      // Delete SupplyContribution entity
      await this.supplyContributionRepository.remove(contribution);

      // Invalidate cache for event supplies
      if (supply) {
        await this.invalidateSuppliesCache(supply.eventId);
      }
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException || 
          error instanceof ForbiddenException || 
          error instanceof NotFoundException) {
        throw error;
      }
      
      // Handle TypeORM errors
      if (error instanceof QueryFailedError) {
        this.logger.error(`Database error deleting contribution: ${error.message}`, error.stack);
        throw new BadRequestException('Erro ao deletar contribuição: problema no banco de dados');
      }
      
      // Log unexpected errors
      this.logger.error(`Unexpected error deleting contribution: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao deletar contribuição');
    }
  }

  // Authorization Helpers
  private async verifyEventOwnerOrAdmin(eventId: string, userId: string): Promise<void> {
    try {
      // Query UserEvent to get owner and associated groups
      const event = await this.userEventRepository.findOne({
        where: { id: eventId },
        relations: ['groups'],
      });

      if (!event) {
        throw new NotFoundException('Evento não encontrado');
      }

      // Check if user is event owner
      if (event.userId === userId) {
        return;
      }

      console.log('User ID: ', userId); 

      // Check if user is admin of any associated group
      if (event.groups && event.groups.length > 0) {
        const groupIds = event.groups.map((group) => group.id);
        
        // Query group memberships to check if user is owner/admin of any group
        for (const groupId of groupIds) {
          const group = event.groups.find((g) => g.id === groupId);
          if (group && group.ownerId === userId) {
            return;
          }
        }
      }

      throw new ForbiddenException('Apenas o dono do evento ou administradores do grupo podem criar suprimentos');
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      
      // Handle TypeORM errors
      if (error instanceof QueryFailedError) {
        this.logger.error(`Database error verifying event owner/admin: ${error.message}`, error.stack);
        throw new BadRequestException('Erro ao verificar permissões');
      }
      
      // Log unexpected errors
      this.logger.error(`Unexpected error verifying event owner/admin: ${error.message}`, error.stack);
      throw new ForbiddenException('Erro ao verificar permissões');
    }
  }

  private async verifyEventParticipant(eventId: string, userId: string): Promise<void> {
    try {
      // Query UserEvent to get associated groups
      const event = await this.userEventRepository.findOne({
        where: { id: eventId },
        relations: ['groups'],
      });

      
      const isParticipant = await this.eventParticipantRepository.exists({
        where: { eventId: eventId, userId: userId },
      })

      if (!event) {
        throw new NotFoundException('Evento não encontrado');
      }

      // Check if user is event owner (owner is always a participant)
      if (event.userId === userId) {
        return;
      }

      // Check is user is participant
      if(!isParticipant) {
        throw new ForbiddenException('Apenas participantes do evento podem criar contribuições');
      }

    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      
      if (error instanceof QueryFailedError) {
        this.logger.error(`Database error verifying event participant: ${error.message}`, error.stack);
        throw new BadRequestException('Erro ao verificar permissões');
      }
      
      this.logger.error(`Unexpected error verifying event participant: ${error.message}`, error.stack);
      throw new ForbiddenException('Erro ao verificar permissões');
    }
  }

  private async verifyContributionOwner(contributionId: string, userId: string): Promise<void> {
    try {
      // Query SupplyContribution to get userId
      const contribution = await this.supplyContributionRepository.findOne({
        where: { id: contributionId },
      });

      if (!contribution) {
        throw new NotFoundException('Contribuição não encontrada');
      }

      // Throw ForbiddenException if userId doesn't match requesting user
      if (contribution.userId !== userId) {
        throw new ForbiddenException('Você não tem permissão para modificar esta contribuição');
      }
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      
      // Handle TypeORM errors
      if (error instanceof QueryFailedError) {
        this.logger.error(`Database error verifying contribution owner: ${error.message}`, error.stack);
        throw new BadRequestException('Erro ao verificar permissões');
      }
      
      // Log unexpected errors
      this.logger.error(`Unexpected error verifying contribution owner: ${error.message}`, error.stack);
      throw new ForbiddenException('Erro ao verificar permissões');
    }
  }

  // Validation Helpers
  private async validateContributionQuantity(
    supplyId: string,
    newQuantity: number,
    excludeContributionId?: string,
  ): Promise<ValidationResult> {
    try {
      // Query all contributions for the supply
      const supply = await this.eventSupplyRepository.findOne({
        where: { id: supplyId },
        relations: ['contributions'],
      });

      if (!supply) {
        throw new NotFoundException('Suprimento não encontrado');
      }

      // Calculate total committed using calculateTotalCommitted helper
      const currentTotal = this.calculateTotalCommitted(
        supply.contributions || [],
        excludeContributionId,
      );

      const newTotal = currentTotal + newQuantity;

      // Calculate maximum allowed as quantityNeeded * 1.2
      const maxAllowed = Math.floor(supply.quantityNeeded * 1.2);

      // Return validation result with isValid flag and warning message
      if (newTotal > maxAllowed) {
        return {
          isValid: false,
          warning: `Não é possível comprometer ${newQuantity} ${supply.unit}. O evento precisa de ${supply.quantityNeeded}, já tem ${currentTotal} comprometido. Máximo permitido: ${maxAllowed}.`,
        };
      }

      // If within 20% threshold but over needed, return warning
      if (newTotal > supply.quantityNeeded) {
        return {
          isValid: true,
          warning: `Aviso: A contribuição excede a quantidade necessária. Total comprometido: ${newTotal} de ${supply.quantityNeeded} ${supply.unit} necessários.`,
        };
      }

      return {
        isValid: true,
      };
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      // Handle TypeORM errors
      if (error instanceof QueryFailedError) {
        this.logger.error(`Database error validating contribution quantity: ${error.message}`, error.stack);
        throw new BadRequestException('Erro ao validar quantidade da contribuição');
      }
      
      // Log unexpected errors
      this.logger.error(`Unexpected error validating contribution quantity: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao validar quantidade da contribuição');
    }
  }

  private calculateTotalCommitted(contributions: SupplyContribution[], excludeId?: string): number {
    // Sum all contribution quantities
    return contributions
      .filter((contribution) => !excludeId || contribution.id !== excludeId)
      .reduce((total, contribution) => total + contribution.quantityCommitted, 0);
  }

  // Cache Management
  private async invalidateSuppliesCache(eventId: string): Promise<void> {
    const cacheKey = this.getCacheKey(eventId);
    
    try {
      await this.cacheManager.del(cacheKey);
    } catch (cacheError) {
      this.logger.warn(`Cache deletion failed for ${cacheKey}: ${cacheError.message}`);
    }

    await this.publishCacheInvalidation(cacheKey, eventId);
  }

  private async publishCacheInvalidation(cacheKey: string, eventId: string, attempt: number = 1): Promise<void> {
    const maxRetries = 3;
    const baseDelay = 100; // milliseconds

    try {
      this.rabbitMQClient.emit('cache.invalidate', {
        key: cacheKey,
        eventId,
        timestamp: new Date().toISOString(),
      });
    } catch (rabbitError) {
      this.logger.warn(`RabbitMQ publish failed (attempt ${attempt}/${maxRetries}): ${rabbitError.message}`);
      
      // Implement retry logic with exponential backoff
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff: 100ms, 200ms, 400ms
        this.logger.debug(`Retrying RabbitMQ publish in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.publishCacheInvalidation(cacheKey, eventId, attempt + 1);
      } else {
        // After max retries, log error but don't fail request
        this.logger.error(`RabbitMQ publish failed after ${maxRetries} attempts. Cache invalidation message lost.`);
      }
    }
  }

  private getCacheKey(eventId: string): string {
    return `event:supplies:${eventId}`;
  }
}
