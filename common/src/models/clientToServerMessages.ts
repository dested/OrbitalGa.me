import {PlayerInputKeys} from '../entities/playerEntity';
import {PlayerWeapon} from '../game/gameRules';
import {SDElement, SDTypeLookup, SDTypeLookupElements} from '../schemaDefiner/schemaDefinerTypes';
import {PlayerInputKeyBitmask, PlayerWeaponEnumSchema} from './enums';
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

const CTOSTypes: {[key in ClientToServerMessage['type']]: number} = {
  playerInput: 1,
  join: 2,
  ping: 3,
  spectate: 4,
};

const CTOSPingSchema: SDTypeLookup<ClientToServerMessage, 'ping'> = {type: CTOSTypes.ping, ping: 'uint32'};

const CTOSJoinSchema: SDTypeLookup<ClientToServerMessage, 'join'> = {type: CTOSTypes.join, name: 'string'};

const CTOSSpectateSchema: SDTypeLookup<ClientToServerMessage, 'spectate'> = {type: CTOSTypes.spectate};

const CTOSPlayerInputSchema: SDTypeLookup<ClientToServerMessage, 'playerInput'> = {
  type: CTOSTypes.playerInput,
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
