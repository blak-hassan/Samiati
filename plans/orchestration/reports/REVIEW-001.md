# REVIEW-001

Two remaining UI objections, both **P2**:

1. **Reactive reordering can apply review details to the wrong submission.** [ValidationRunner.tsx:61](C:/Users/pc/Documents/samiati-1.0/src/components/changa/ValidationRunner.tsx:61) selects the first unreviewed item on every update. With A open and a rejection reason/note entered, reordering `[A,B]` to `[B,A]` switches to B while retaining A’s inputs. An offline component-handler check confirmed Reject submits B with A’s details. Higher-priority arrivals can trigger the same problem. **Minimal fix:** retain the active submission ID while eligible, associate inputs with that ID, and reset them when selection changes. Add reorder/arrival interaction coverage.

2. **Explicit Sign in still drops the guest draft.** [HomeSearchScreen.tsx:657](C:/Users/pc/Documents/samiati-1.0/src/components/screens/HomeSearchScreen.tsx:657) navigates without a return URL; [AppSidebar.tsx:250](C:/Users/pc/Documents/samiati-1.0/src/components/shared/AppSidebar.tsx:250) does likewise. Only Send preserves the question. Following explicit Sign in therefore falls back to `/dashboard` without the draft. **Minimal fix:** preserve the current draft through every guest sign-in entry point, distinguishing draft restoration from the Send action so signing in alone does not send it.

**UI recommendation:** hold acceptance pending these fixes. Other offline checks passed: correction promotion retains the returned ID/code/text; Recent includes pinned history; invalid checkout plans use the supported fallback; guest mounting makes no requests; queue advancement handles both removal orderings.

**Account recommendation:** accept `90a53d5d13ac190bab4e3b2b1d89f776a395a8d3`. No blocking findings. Public billing/usage reads enforce ownership, cancellation rejects before writes, and handle updates check the indexed target before patching. Internal accounting contracts remain unchanged.

Independent verification: **22 focused UI tests and 50 Account/privacy tests passed**, plus the offline component-handler checks described above. No browser, live-service, or production-build verification was repeated. Convex concurrency safety rests on the indexed read within the mutation; fake-context tests do not exercise its concurrency engine. No files were edited.
