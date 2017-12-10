

export class Utils {
    static generateId(): string {
        return (Math.random() * 100000).toFixed(0);
    }
}