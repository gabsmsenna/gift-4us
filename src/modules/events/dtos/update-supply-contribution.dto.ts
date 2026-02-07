import { IsInt, Min, IsString, IsOptional } from 'class-validator';

export class UpdateSupplyContributionDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  quantityCommitted?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
