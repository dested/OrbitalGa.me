import {PlayerInputKeys} from '../entities/playerEntity';
import {PlayerWeapon} from '../game/gameRules';
import {SDTypeLookup, SDTypeLookupElements} from '../schemaDefiner/schemaDefinerTypes';
import {PlayerInputKeyBitmask, PlayerWeaponEnumSchema} from './schemaEnums';
import {SchemaDefiner} from '../schemaDefiner/schemaDefiner';

type CTOSJoin = {name: string; type: 'join'};
type CTOSSpectate = {type: 'spectate'};
type CTOSPing = {ping: number; type: 'ping'};
type CTOSPlayerInput = {
  inputSequenceNumber: number;
  keys: PlayerInputKeys;
  type: 'playerInput';
  weapon: PlayerWeapon | 'unset';
};

export type ClientToServerMessage = CTOSJoin | CTOSSpectate | CTOSPing | CTOSPlayerInput;

const CTOSPingSchema: SDTypeLookup<ClientToServerMessage, 'ping'> = {ping: 'uint32'};

const CTOSJoinSchema: SDTypeLookup<ClientToServerMessage, 'join'> = {name: 'string'};

const CTOSSpectateSchema: SDTypeLookup<ClientToServerMessage, 'spectate'> = {};

const CTOSPlayerInputSchema: SDTypeLookup<ClientToServerMessage, 'playerInput'> = {
  inputSequenceNumber: 'uint32',
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
