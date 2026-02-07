import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class CreateEventSupplyDto {
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  quantityNeeded: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsUrl()
  @IsOptional()
  url?: string;
}
