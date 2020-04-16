import {PlayerInputKeys} from '../entities/playerEntity';
import {PlayerWeapon} from '../game/gameRules';
import {AB, ABByType} from '../parsers/arrayBufferSchemaTypes';
import {PlayerInputKeyBitmask, PlayerWeaponEnumSchema} from './enums';
import {ServerToClientMessage, ServerToClientSchema, STOCError} from './serverToClientMessages';
import {ArrayBufferSchemaBuilder} from '../parsers/arrayBufferSchemaBuilder';

type CTOSJoin = {name: string; type: 'join'};
type CTOSSpectate = {type: 'spectate'};
type CTOSPing = {ping: number; type: 'ping'};
type CTOSPlayerInput = {inputSequenceNumber: number; keys: PlayerInputKeys; type: 'playerInput'; weapon?: PlayerWeapon};

export type ClientToServerMessage = CTOSJoin | CTOSSpectate | CTOSPing | CTOSPlayerInput;

const CTOSTypes: {[key in ClientToServerMessage['type']]: number} = {
  playerInput: 1,
  join: 2,
  ping: 3,
  spectate: 4,
};

const CTOSPingSchema: ABByType<ClientToServerMessage, 'ping'> = {type: CTOSTypes.ping, ping: 'uint32'};

const CTOSJoinSchema: ABByType<ClientToServerMessage, 'join'> = {type: CTOSTypes.join, name: 'string'};

const CTOSSpectateSchema: ABByType<ClientToServerMessage, 'spectate'> = {type: CTOSTypes.spectate};

const CTOSPlayerInputSchema: ABByType<ClientToServerMessage, 'playerInput'> = {
  type: CTOSTypes.playerInput,
  inputSequenceNumber: 'uint32',
  keys: PlayerInputKeyBitmask,
  weapon: PlayerWeaponEnumSchema,
};
export const ClientToServerSchema: AB<ClientToServerMessage> = {
  flag: 'type-lookup',
  elements: {
    ping: CTOSPingSchema,
    join: CTOSJoinSchema,
    spectate: CTOSSpectateSchema,
    playerInput: CTOSPlayerInputSchema,
  },
};

export const ClientToServerSchemaReaderFunction = ArrayBufferSchemaBuilder.generateReaderFunction(ClientToServerSchema);
