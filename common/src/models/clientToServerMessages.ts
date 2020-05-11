import {PlayerInputKeys} from '../entities/playerEntity';
import {PlayerWeapon} from '../game/gameRules';
import {SDTypeLookup, SDTypeLookupElements} from '../schemaDefiner/schemaDefinerTypes';
import {PlayerInputKeyBitmask, PlayerWeaponEnumSchema} from './schemaEnums';
import {SchemaDefiner} from '../schemaDefiner/schemaDefiner';

type CTOSJoin = {type: 'join'};
type CTOSSpectate = {type: 'spectate'};
type CTOSPing = {ping: number; type: 'ping'};

export type CTOSPlayerInput = {
  keys: PlayerInputKeys;
  messageIndex: number;
  movement: boolean;
  step: number;
  type: 'playerInput';
  weapon: PlayerWeapon | 'unset';
};

export type ClientToServerMessage = CTOSJoin | CTOSSpectate | CTOSPing | CTOSPlayerInput;

const CTOSPingSchema: SDTypeLookup<ClientToServerMessage, 'ping'> = {ping: 'uint32'};

const CTOSJoinSchema: SDTypeLookup<ClientToServerMessage, 'join'> = {};

const CTOSSpectateSchema: SDTypeLookup<ClientToServerMessage, 'spectate'> = {};

export const CTOSPlayerInputSchema: SDTypeLookup<ClientToServerMessage, 'playerInput'> = {
  messageIndex: 'uint32',
  movement: 'boolean',
  step: 'uint32',
  keys: PlayerInputKeyBitmask,
  weapon: {...PlayerWeaponEnumSchema, unset: 0},
};

const ClientToServerSchema: SDTypeLookupElements<ClientToServerMessage> = {
  flag: 'type-lookup',
  elements: {
    ping: CTOSPingSchema,
    join: CTOSJoinSchema,
    spectate: CTOSSpectateSchema,
    playerInput: CTOSPlayerInputSchema,
  },
};

export const ClientToServerSchemaReaderFunction = SchemaDefiner.generateReaderFunction(ClientToServerSchema);
export const ClientToServerSchemaAdderFunction = SchemaDefiner.generateAdderFunction(ClientToServerSchema);
export const ClientToServerSchemaAdderSizeFunction = SchemaDefiner.generateAdderSizeFunction(ClientToServerSchema);
