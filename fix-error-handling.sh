#!/bin/bash

# Fix the getSupplyContributions error handling
sed -i '320,322d' src/modules/events/services/event-supplies.service.ts
sed -i '319a\    } catch (error) {\n      // Handle TypeORM errors\n      if (error instanceof QueryFailedError) {\n        this.logger.error(`Database error fetching contributions: ${error.message}`, error.stack);\n        throw new BadRequestException('\''Erro ao buscar contribuições: problema no banco de dados'\'');\n      }\n      \n      // Log unexpected errors\n      this.logger.error(`Unexpected error fetching contributions: ${error.message}`, error.stack);\n      throw new BadRequestException('\''Erro ao buscar contribuições'\'');\n    }' src/modules/events/services/event-supplies.service.ts
