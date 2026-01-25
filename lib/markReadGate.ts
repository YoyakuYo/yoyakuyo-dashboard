type TimeProvider = () => number;

export interface MarkReadGateConfig {
  debounceMs?: number;
  timeProvider?: TimeProvider;
}

export class MarkReadGate {
  private lastMarkedConversation: string | null = null;
  private readonly lastAttemptTimestamps: Record<string, number> = {};
  private readonly failedConversations = new Set<string>();
  private readonly debounceMs: number;
  private readonly timeProvider: TimeProvider;

  constructor(config: MarkReadGateConfig = {}) {
    this.debounceMs = config.debounceMs ?? 400;
    this.timeProvider = config.timeProvider ?? (() => Date.now());
  }

  canMark(conversationId: string, unreadCount: number): boolean {
    if (!conversationId) return false;
    if (this.failedConversations.has(conversationId)) return false;

    const now = this.timeProvider();
    const lastAttempt = this.lastAttemptTimestamps[conversationId];
    if (lastAttempt !== undefined && now - lastAttempt < this.debounceMs) {
      return false;
    }

    const conversationChanged = this.lastMarkedConversation !== conversationId;
    const hasUnread = unreadCount > 0;

    return conversationChanged || hasUnread;
  }

  recordAttempt(conversationId: string) {
    this.lastAttemptTimestamps[conversationId] = this.timeProvider();
  }

  recordSuccess(conversationId: string) {
    this.lastMarkedConversation = conversationId;
    this.failedConversations.delete(conversationId);
  }

  recordFailure(conversationId: string) {
    this.failedConversations.add(conversationId);
  }

  hasFailed(conversationId: string): boolean {
    return this.failedConversations.has(conversationId);
  }

  reset(conversationId?: string) {
    if (conversationId) {
      this.failedConversations.delete(conversationId);
      delete this.lastAttemptTimestamps[conversationId];
      if (this.lastMarkedConversation === conversationId) {
        this.lastMarkedConversation = null;
      }
    } else {
      this.failedConversations.clear();
      Object.keys(this.lastAttemptTimestamps).forEach((key) => delete this.lastAttemptTimestamps[key]);
      this.lastMarkedConversation = null;
    }
  }
}
