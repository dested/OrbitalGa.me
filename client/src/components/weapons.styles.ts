import glamorous from 'glamorous';
import {ClientLivePlayerActor} from '../game/entities/clientLivePlayerActor';
import {AvailablePlayerWeapon} from '@common/entities/playerEntity';
export const boxSize = '7.5vh';

export const SelectWeaponBox = glamorous.div<{liveEntity: ClientLivePlayerActor; weapon: AvailablePlayerWeapon}>(
  ({weapon, liveEntity}) => ({
    width: boxSize,
    height: boxSize,
    backgroundColor: 'rgba(0,0,0,.2)',
    margin: '5px',
    border: 'solid 6px ' + (liveEntity.selectedWeapon === weapon.weapon ? '#c14747' : '#C2C7C8'),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '25%',
  })
);
