import { describe, expect, it } from "vitest";

import { ReplySession } from "@/lib/chat/reply-session";

describe("ReplySession", () => {
  it("gives the ownership to the reply that starts", () => {
    const session = new ReplySession();
    const controller = session.begin();

    expect(session.owns(controller)).toBe(true);
  });

  it("aborts the reply that was running when a new one starts", () => {
    const session = new ReplySession();
    const first = session.begin();
    const second = session.begin();

    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(false);
  });

  it("takes the ownership from the reply it supersedes", () => {
    const session = new ReplySession();
    const first = session.begin();
    const second = session.begin();

    expect(session.owns(first)).toBe(false);
    expect(session.owns(second)).toBe(true);
  });

  it("does not let a superseded reply release the ownership", () => {
    const session = new ReplySession();
    const first = session.begin();
    const second = session.begin();

    expect(session.release(first)).toBe(false);
    expect(session.owns(second)).toBe(true);
  });

  it("releases the ownership for the reply that owns it", () => {
    const session = new ReplySession();
    const controller = session.begin();

    expect(session.release(controller)).toBe(true);
    expect(session.owns(controller)).toBe(false);
  });

  it("stops the reply that is running", () => {
    const session = new ReplySession();
    const controller = session.begin();

    session.stop();

    expect(controller.signal.aborted).toBe(true);
  });
});