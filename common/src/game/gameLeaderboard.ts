import {assertType, Utils} from '../utils/utils';

export type LeaderboardEntry = {
  aliveTime: number;
  calculatedScore: number;
  damageGiven: number;
  damageTaken: number;
  enemiesKilled: number;
  eventsParticipatedIn: number;
  shotsFired: number;
};
export type LeaderboardEntryRanked = LeaderboardEntry & {rank: number; userId: number; username: string};

const leaderboardEntryRankedKeysObject: {[key in Exclude<keyof LeaderboardEntryRanked, 'username'>]: true} = {
  rank: true,
  userId: true,
  aliveTime: true,
  damageGiven: true,
  damageTaken: true,
  enemiesKilled: true,
  eventsParticipatedIn: true,
  shotsFired: true,
  calculatedScore: true,
};
export const LeaderboardEntryRankedKeys = Utils.safeKeys(leaderboardEntryRankedKeysObject);
export const LeaderboardEntryWeight: {[key in keyof LeaderboardEntry]: number} = {
  aliveTime: 0.001 /**/,
  damageGiven: 2 /**/,
  damageTaken: 0.5 /**/,
  enemiesKilled: 3,
  eventsParticipatedIn: 10,
  shotsFired: 0.2 /**/,
  calculatedScore: 0,
};

export class GameLeaderboard {
  activePlayerScores: {[userId: number]: LeaderboardEntry} = {};
  totalPlayerScores: {[userId: number]: LeaderboardEntry} = {};

  addPlayer(userId: number) {
    this.activePlayerScores[userId] = GameLeaderboard.initializeBoard();
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

  updateScores(): LeaderboardEntryRanked[] {
    for (const userId in this.activePlayerScores) {
      this.activePlayerScores[userId].calculatedScore = GameLeaderboard.calculateScore(this.activePlayerScores[userId]);
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
    for (const entryKey in entry) {
      assertType<keyof LeaderboardEntry>(entryKey);
      score += entry[entryKey] * LeaderboardEntryWeight[entryKey];
    }
    return score;
  }

  private static initializeBoard(): LeaderboardEntry {
    return {
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
