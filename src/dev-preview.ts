// Development only: `?preview=era` or `?preview=heir` jumps straight to a screen that
// normally takes a long play to reach, by playing a family forward and saving it locally.
// It replaces the local dev save, so it never runs in a production build.
import {
  candidates,
  choiceAvailable,
  choose,
  continueStory,
  create,
  currentEvent,
  succeed,
  type State,
} from './engine';

const SAVE_KEY = 'thousand-lineage-v1';

function playUntil(done: (s: State) => boolean): State | undefined {
  for (let seed = 1; seed <= 40; seed++) {
    let s: State = { ...create(seed, 0, 'commoner'), runId: `preview-${seed}-${Date.now()}` };
    for (let n = 0; n < 400 && s.phase !== 'ended'; n++) {
      if (s.report) s = continueStory(s); // close the turn result first
      if (done(s)) return s;
      if (s.chapterEnd) {
        s = continueStory(s);
        continue;
      }
      if (s.phase === 'succession') {
        s = succeed(s, candidates(s)[0].id);
        continue;
      }
      const open = currentEvent(s)
        .choices.map((_, i) => i)
        .filter(i => choiceAvailable(s, i));
      s = choose(s, open[(seed + n) % open.length]);
    }
  }
}

const scenes: Record<string, (s: State) => boolean> = {
  era: s => !!s.chapterEnd,
  heir: s => s.phase === 'succession',
};

if (import.meta.env.DEV) {
  const scene = new URLSearchParams(location.search).get('preview');
  const reached = scene && scenes[scene] ? playUntil(scenes[scene]) : undefined;
  if (reached) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(reached));
    history.replaceState(null, '', location.pathname);
  }
}
