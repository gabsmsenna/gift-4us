export class EventSupplyWithProgressDto {
  id: string;
  eventId: string;
  itemName: string;
  description: string;
  quantityNeeded: number;
  unit: string;
  imageUrl: string;
  url: string;
  quantityCommitted: number;
  fulfillmentPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}
