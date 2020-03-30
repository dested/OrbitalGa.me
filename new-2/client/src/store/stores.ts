import {MobXProviderContext} from 'mobx-react';
import React from 'react';
import {uiStore, UIStoreProps} from './uiStore';

export type AllStores = UIStoreProps;

export const stores: AllStores = {
  uiStore,
};

export function useStores(): AllStores {
  return React.useContext(MobXProviderContext) as any;
}
