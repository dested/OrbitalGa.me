import {SDSimpleObject} from '../schemaDefiner/schemaDefinerTypes';

export interface ShadowableEntity {
  inputId: number;
  shadowEntity: boolean;
}

export type ShadowEntityModel = {
  inputId: number;
};

export const ShadowEntityModelSchema: SDSimpleObject<ShadowEntityModel> = {
  inputId: 'uint32',
};
