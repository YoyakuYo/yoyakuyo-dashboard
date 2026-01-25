import test from "node:test";
import assert from "node:assert/strict";

import { MarkReadGate } from "./markReadGate";

const createTimeHelper = (start = 0) => {
  let now = start;
  return {
    now: () => now,
    advance: (ms: number) => {
      now += ms;
    },
  };
};

test("MarkReadGate follows guard rules for guest conversations", () => {
  const helper = createTimeHelper(0);
  const gate = new MarkReadGate({ debounceMs: 300, timeProvider: helper.now });

  // Guest sends a message and shop opens it for the first time.
  assert.ok(gate.canMark("guest-conv", 1), "should mark on first visit with unread messages");
  gate.recordAttempt("guest-conv");
  gate.recordSuccess("guest-conv");

  // No unread messages now, so mark should not rerun until there is new content.
  assert.ok(!gate.canMark("guest-conv", 0), "skip mark-read if already marked");

  // New guest message arrives; unread_count increases so we should mark again.
  helper.advance(350);
  assert.ok(gate.canMark("guest-conv", 2), "new unread should open mark-read path");
  gate.recordAttempt("guest-conv");

  // Quick repeats within the debounce window are ignored.
  helper.advance(50);
  assert.ok(!gate.canMark("guest-conv", 2), "should respect debounce window");

  // After debounce resets we can mark again.
  helper.advance(400);
  assert.ok(gate.canMark("guest-conv", 2), "debounce expired, should mark again");
  gate.recordAttempt("guest-conv");

  // Simulate a 404 response and ensure future retries are blocked.
  gate.recordFailure("guest-conv");
  helper.advance(500);
  assert.ok(!gate.canMark("guest-conv", 3), "404 mark-read should stop future attempts");
});
