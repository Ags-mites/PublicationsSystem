import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, ApiCreatedResponse, getSchemaPath } from '@nestjs/swagger';
import { BaseResponseDto } from '../dto/base-response.dto';

export const ApiSuccessResponse = <TModel extends Type<any>>(
  model: TModel,
  isArray: boolean = false,
) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResponseDto) },
          {
            properties: {
              data: isArray
                ? {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  }
                : { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );
};

export const ApiCreatedSuccessResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiCreatedResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );
};