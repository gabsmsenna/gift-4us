import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class UpdateEventSupplyDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  itemName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantityNeeded?: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  unit?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsUrl()
  @IsOptional()
  url?: string;
}
