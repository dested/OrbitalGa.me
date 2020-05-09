import {GameConstants} from '@common/game/gameConstants';
import {IServerSync} from './IServerSync';
import {Utils} from '@common/utils/utils';
import {LeaderboardEntry, LeaderboardEntryUserDetails} from '@common/game/gameLeaderboard';
import {ServerStatCreateInput} from '@prisma/client';
import {prisma} from '../utils/db';

export class ServerSync implements IServerSync {
  leaderboard: {[sessionId: string]: LeaderboardEntry & LeaderboardEntryUserDetails} = {};
  serverStats: Omit<ServerStatCreateInput, 'server'>[] = [];
  private serverId?: number;
  constructor(private serverPath: string) {}

  setLeaderboardEntry(activePlayerScore: LeaderboardEntry & LeaderboardEntryUserDetails): void {
    this.leaderboard[activePlayerScore.sessionId] = activePlayerScore;
  }

  async setStat(serverStat: Omit<ServerStatCreateInput, 'server'>) {
    this.serverStats.push(serverStat);
    const messages = [
      `#${serverStat.tickIndex}`,
      `Con: ${serverStat.connections}`,
      `Spc ${serverStat.spectators}`,
      `Usrs: ${serverStat.users}`,
      `Ents: ${serverStat.entities}`,
      `Msg:${serverStat.messages}`,
      `Duration: ${serverStat.duration}ms`,
      `-> ${Utils.formatBytes(serverStat.totalBytesSent)}`,
      `<- ${Utils.formatBytes(serverStat.totalBytesReceived)}`,
      `Wdt: ${serverStat.boardWidth}`,
      `Mem:${Utils.formatBytes(serverStat.memHeapUsed)}/${Utils.formatBytes(serverStat.memHeapTotal)}`,
      `${serverStat.entityGroupCount}`,
    ];
    console.clear();
    console.log(messages.join(','));

    if (this.serverStats.length > 10_000 / GameConstants.serverTickRate) {
      // console.log('pushing updates', this.serverStats.length);
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
    try {
      console.log('starting server');
      console.log('0');
      const server = await prisma.server.create({
        data: {
          serverUrl: this.serverPath,
          live: true,
        },
        select: {id: true},
      });
      console.log('started installed');
      console.log('serverid', server.id);
      this.serverId = server.id;
    } catch (ex) {
      console.error('ERROR', ex);
    }
  }

  async syncLeaderboard(): Promise<void> {
    const leaderboard = {...this.leaderboard};
    this.leaderboard = {};
    const awaiter = async () => {
      const sessionIds = Object.keys(leaderboard);
      if (sessionIds.length === 0) return;
      const foundSessions = Utils.toDictionaryStr(
        await prisma.globalLeaderboardEntry.findMany({
          where: {
            sessionId: {
              in: sessionIds,
            },
          },
          select: {
            sessionId: true,
          },
        }),
        (a) => a.sessionId
      );
      await Promise.all(
        Object.keys(leaderboard).map(async (leaderboardKey) => {
          const activePlayerScore = leaderboard[leaderboardKey];
          if (foundSessions[activePlayerScore.sessionId]) {
            await prisma.globalLeaderboardEntry.update({
              where: {
                sessionId: activePlayerScore.sessionId,
              },
              data: {
                score: Math.round(activePlayerScore.calculatedScore),
                updatedAt: new Date(),
                aliveTime: activePlayerScore.aliveTime,
                damageGiven: activePlayerScore.damageGiven,
                damageTaken: activePlayerScore.damageTaken,
                enemiesKilled: activePlayerScore.enemiesKilled,
                eventsParticipatedIn: activePlayerScore.eventsParticipatedIn,
                shotsFired: activePlayerScore.shotsFired,
              },
              select: {id: true},
            });
          } else {
            await prisma.globalLeaderboardEntry.create({
              data: {
                score: Math.round(activePlayerScore.calculatedScore),
                createdAt: new Date(),
                aliveTime: activePlayerScore.aliveTime,
                damageGiven: activePlayerScore.damageGiven,
                damageTaken: activePlayerScore.damageTaken,
                enemiesKilled: activePlayerScore.enemiesKilled,
                eventsParticipatedIn: activePlayerScore.eventsParticipatedIn,
                shotsFired: activePlayerScore.shotsFired,
                sessionId: activePlayerScore.sessionId,
                server: {
                  connect: {
                    id: this.serverId!,
                  },
                },
                user: {
                  connect: {
                    id: activePlayerScore.jwtId,
                  },
                },
              },
              select: {id: true},
            });
          }
        })
      );
    };
    awaiter().then(() => {});
  }
}
