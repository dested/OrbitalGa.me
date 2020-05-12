import {assertType, Utils} from '../utils/utils';
import {IServerSync} from '../../../server/src/game/IServerSync';
import {uuid} from '../utils/uuid';

export type LeaderboardEntry = {
  aliveTime: number;
  calculatedScore: number;
  damageGiven: number;
  damageTaken: number;
  enemiesKilled: number;
  eventsParticipatedIn: number;
  shotsFired: number;
};

const LeaderboardEntryKeys: {[key in keyof LeaderboardEntry]: true} = {
  aliveTime: true,
  calculatedScore: true,
  damageGiven: true,
  damageTaken: true,
  enemiesKilled: true,
  eventsParticipatedIn: true,
  shotsFired: true,
};

export type LeaderboardEntryUserDetails = {
  jwtId: number;
  sessionId: string;
};

export type LeaderboardEntryRanked = LeaderboardEntry & {rank: number; userId: number; username: string};

export const LeaderboardEntryWeight: {[key in keyof LeaderboardEntry]: number} = {
  aliveTime: 0.00025 /**/,
  damageGiven: 2 /**/,
  damageTaken: 0.25 /**/,
  enemiesKilled: 3,
  eventsParticipatedIn: 10,
  shotsFired: 0.1 /**/,
  calculatedScore: 0,
};
// todo leaderboard

export class GameLeaderboard {
  activePlayerScores: {[userId: number]: LeaderboardEntry & LeaderboardEntryUserDetails} = {};
  totalPlayerScores: {[userId: number]: LeaderboardEntry & LeaderboardEntryUserDetails} = {};
  private serverSync?: IServerSync;

  addPlayer(userId: number, jwtId: number) {
    this.activePlayerScores[userId] = GameLeaderboard.initializeBoard(jwtId, uuid());
    this.totalPlayerScores[userId] = this.activePlayerScores[userId];
  }

  increaseEntry(userId: number, entry: keyof LeaderboardEntry, value: number) {
    if (this.activePlayerScores[userId]) this.activePlayerScores[userId][entry] += value;
  }

  removePlayer(userId: number) {
    delete this.activePlayerScores[userId];
  }

  setEntry(userId: number, entry: keyof LeaderboardEntry, value: number) {
    if (this.activePlayerScores[userId]) this.activePlayerScores[userId][entry] = value;
  }

  setServerSync(serverSync: IServerSync) {
    this.serverSync = serverSync;
  }

  updateScores(): LeaderboardEntryRanked[] {
    for (const userId in this.activePlayerScores) {
      this.activePlayerScores[userId].calculatedScore = GameLeaderboard.calculateScore(this.activePlayerScores[userId]);
      this.serverSync?.setLeaderboardEntry(this.activePlayerScores[userId]);
    }

    return Utils.mapObjToArray(this.activePlayerScores, (userId) => ({
      userId: parseInt(userId),
      rank: 0,
      username: '',
      ...this.activePlayerScores[parseInt(userId)],
    }))
      .sort((a, b) => b.calculatedScore - a.calculatedScore)
      .map((score, index) => ({...score, rank: index + 1}));
  }

  private static calculateScore(entry: LeaderboardEntry) {
    let score = 0;
    for (const entryKey of Utils.safeKeys(LeaderboardEntryKeys)) {
      score += entry[entryKey] * LeaderboardEntryWeight[entryKey];
    }
    return score;
  }

  private static initializeBoard(jwtId: number, sessionId: string): LeaderboardEntry & LeaderboardEntryUserDetails {
    return {
      jwtId,
      sessionId,
      eventsParticipatedIn: 0,
      enemiesKilled: 0,
      damageTaken: 0,
      damageGiven: 0,
      aliveTime: 0,
      shotsFired: 0,
      calculatedScore: 0,
    };
  }
}
