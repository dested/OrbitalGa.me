import {assertType} from '../utils/utils';

type DataSize = 'uint8' | 'uint16' | 'uint32' | 'float32' | 'boolean';

export function dataSerialize(type: DataSize) {
  return (classType: any, name: string) => {
    assertType<SerializableClass>(classType);
    classType.fields = classType.fields || [];
    classType.fields.push({name, type});
  };
}

export interface SerializableClass {
  fields: {name: string; type: DataSize}[];
}
