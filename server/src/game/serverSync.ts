import {prisma, ServerStat, ServerStatCreateInput} from 'orbitalgame-server-common/build/index';
import {GameConstants} from '@common/game/gameConstants';
import {IServerSync} from './IServerSync';
import {Utils} from '@common/utils/utils';

export class ServerSync implements IServerSync {
  serverStats: Omit<ServerStatCreateInput, 'server'>[] = [];
  private serverId?: number;
  async setStat(serverStat: Omit<ServerStatCreateInput, 'server'>) {
    this.serverStats.push(serverStat);
    console.log(
      `#${serverStat.tickIndex}, Con: ${serverStat.connections}, Usr: ${serverStat.users}, Spc ${
        serverStat.spectators
      }, Ents: ${serverStat.entities}, Msg:${serverStat.messages}, Duration: ${
        serverStat.duration
      }ms, -> ${Utils.formatBytes(serverStat.totalBytesSent)}, <- ${Utils.formatBytes(
        serverStat.totalBytesReceived
      )}, Wdt: ${serverStat.boardWidth}, Mem:${Utils.formatBytes(serverStat.memHeapUsed)}/${Utils.formatBytes(
        serverStat.memHeapTotal
      )}/${Utils.formatBytes(serverStat.memExternal)} ${serverStat.entityGroupCount}`
    );

    if (this.serverStats.length > 10_000 / GameConstants.serverTickRate) {
      console.log('pushing updates', this.serverStats.length);
      const statsToPush = [...this.serverStats];
      this.serverStats.length = 0;
      const awaiter = async () => {
        await prisma.server.update({
          where: {id: this.serverId!},
          data: {
            live: true,
            updatedAt: new Date(),
          },
        });
        await Promise.all(
          statsToPush.map((s) =>
            prisma.serverStat.create({
              data: {
                server: {
                  connect: {
                    id: this.serverId!,
                  },
                },
                ...s,
              },
            })
          )
        );
      };
      awaiter().then(() => {});
    }
  }
  async startServer() {
    const server = await prisma.server.create({
      data: {
        serverUrl: '1',
        live: true,
      },
      select: {id: true},
    });
    console.log(server.id);
    this.serverId = server.id;
  }
}
