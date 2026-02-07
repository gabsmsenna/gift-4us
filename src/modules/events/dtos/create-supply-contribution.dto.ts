import { IsInt, Min, IsString, IsOptional } from 'class-validator';

export class CreateSupplyContributionDto {
  @IsInt()
  @Min(1)
  quantityCommitted: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
