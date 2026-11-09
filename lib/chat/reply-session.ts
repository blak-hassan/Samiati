/**
 * The reply that owns a conversation.
 *
 * Only one reply may write to a conversation at a time. When a second reply
 * starts — the user pressed "try again" while the first one was still
 * streaming — the first one is aborted and loses the ownership: it must not
 * write to the conversation, and it must not clear the state that the two
 * replies share, or the live reply could no longer be stopped.
 */
export class ReplySession {
  private current: AbortController | null = null;

  /** Starts a reply, aborting the one that was running before it. */
  begin(): AbortController {
    this.current?.abort();
    const controller = new AbortController();
    this.current = controller;
    return controller;
  }

  /** True when the reply still owns the conversation. */
  owns(controller: AbortController): boolean {
    return this.current === controller;
  }

  /**
   * Gives up the ownership.
   *
   * Returns false when the reply had already lost it to a newer one, in which
   * case the newer reply keeps the conversation.
   */
  release(controller: AbortController): boolean {
    if (this.current !== controller) return false;
    this.current = null;
    return true;
  }

  /** Stops the reply that is running, if there is one. */
  stop(): void {
    this.current?.abort();
  }
}