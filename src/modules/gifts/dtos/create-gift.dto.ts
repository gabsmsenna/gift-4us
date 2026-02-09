import { IsArray, IsNotEmpty, IsString, IsUUID, IsUrl } from 'class-validator';

export class CreateGiftDto {
  @IsNotEmpty({ message: 'O título do presente é obrigatório' })
  @IsString()
  title: string;

  @IsArray({ message: 'As URLs devem ser enviadas em um array' })
  @IsUrl(
    {},
    {
      each: true,
      message: 'Cada URL de compra deve ser um link válido',
    },
  )
  urls: string[];

  @IsArray({ message: 'Os IDs dos eventos devem ser um array' })
  @IsUUID('4', {
    each: true,
    message: 'Cada ID de evento deve ser um UUID válido',
  })
  eventIds: string[];
}
