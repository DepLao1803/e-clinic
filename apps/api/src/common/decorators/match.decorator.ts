import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/** Laravel's `confirmed` rule: value must equal another property. */
export function Match(property: string, options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'match',
      target: object.constructor,
      propertyName,
      options,
      constraints: [property],
      validator: {
        validate: (value: unknown, args: ValidationArguments) =>
          value === (args.object as Record<string, unknown>)[args.constraints[0]],
      },
    });
}
