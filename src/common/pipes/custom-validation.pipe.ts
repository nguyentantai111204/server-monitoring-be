import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ValidationError, validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform {
    async transform(value: unknown, { metatype }: { metatype?: unknown }) {
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }

        const object = plainToInstance(metatype as new () => object, value);
        const errors = await validate(object as object);

        if (errors.length > 0) {
            const messages = this.formatErrors(errors);
            throw new BadRequestException(messages);
        }

        return object;
    }

    private toValidate(metatype: unknown): boolean {
        const types: unknown[] = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
    }

    private formatErrors(errors: ValidationError[]): string[] {
        return errors.flatMap((error) =>
            Object.values(error.constraints || {}).map((msg) => msg),
        );
    }
}
