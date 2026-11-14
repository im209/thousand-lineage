// App shell: header, which screen is showing, the person dialog, and the footer.
// Each screen lives in ./screens; game rules live in ./engine (→ ./core).
import './styles';
import React, { useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useGame } from './store';
import { societyState, type Person } from './engine';
import { PersonDialog } from './person-dialog';
import { ChallengeLanding } from './challenge-landing';
import { readChallenge, CHALLENGE_RULES, type FamilyChallenge } from './share-links';
import { FounderIntro } from './founder-intro';
import { HomeScreen } from './screens/home-screen';
import { SetupScreen, useClanPicker } from './screens/setup-screen';
import { GameScreen, type GameTab } from './screens/game-screen';
import { AboutScreen } from './screens/about-screen';

type Screen = 'home' | 'setup' | 'game' | 'about' | 'challenge';

function App() {
  const { game: s, start, beginStory, error, saved, records, recordError } = useGame();
  const [invite, setInvite] = useState(() => readChallenge(location.hash));
  const [screen, setScreen] = useState<Screen>(() =>
    invite.kind === 'none' ? (s ? 'game' : 'home') : 'challenge',
  );
  const [tab, setTab] = useState<GameTab>('story');
  const [overview, setOverview] = useState(false);
  const [person, setPerson] = useState<Person | null>(null);
  const [notice, setNotice] = useState('');
  const [animateResult, setAnimateResult] = useState(false);
  const picker = useClanPicker();
  const closePerson = useCallback(() => setPerson(null), []);

  useEffect(() => {
    const receive = () => {
      const next = readChallenge(location.hash);
      setInvite(next);
      setPerson(null);
      setNotice('');
      if (next.kind !== 'none') setScreen('challenge');
      else
        setScreen(current =>
          current === 'challenge' ? (useGame.getState().game ? 'game' : 'home') : current,
        );
    };
    addEventListener('hashchange', receive);
    return () => removeEventListener('hashchange', receive);
  }, []);

  const clearInvite = () => {
    history.replaceState(null, '', location.pathname + location.search);
    setInvite({ kind: 'none' });
  };
  const showStory = () => {
    setScreen('game');
    setTab('story');
    setOverview(false);
  };
  const startChallenge = (data: FamilyChallenge) => {
    if (data.rules !== CHALLENGE_RULES) return;
    start(data.seed, data.clan, data.origin, {
      rules: data.rules,
      years: data.years,
      generations: data.generations,
    });
    clearInvite();
    setPerson(null);
    setNotice('');
    showStory();
    window.scrollTo(0, 0);
  };
  const newGame = () => {
    if (picker.clan < 0) return;
    start(crypto.getRandomValues(new Uint32Array(1))[0], picker.clan);
    showStory();
  };
  const replay = () => {
    if (!s) return;
    start(s.seed, s.clan, societyState(s).origin, s.challenge);
    showStory();
  };

  return (
    <>
      <header>
        <button
          className="brand"
          onClick={() => {
            if (invite.kind !== 'none') clearInvite();
            setScreen('home');
          }}
        >
          <span className="seal">
            千<br />年
          </span>
          <span>
            천년가문<small>이름은 남고, 이야기는 이어진다</small>
          </span>
        </button>
        <nav>
          <button
            onClick={() => {
              if (s) {
                setScreen('game');
                setTab('story');
              } else setScreen('setup');
            }}
          >
            가문의 기록
          </button>
          <button onClick={() => setScreen('about')}>게임 안내 · 출처</button>
          <span className="version">가문 생존 시뮬레이션</span>
        </nav>
      </header>
      {screen === 'challenge' && (
        <ChallengeLanding
          invite={invite}
          game={s}
          onStart={startChallenge}
          onReturn={() => {
            clearInvite();
            setScreen(s ? 'game' : 'home');
          }}
          onNew={() => {
            clearInvite();
            setScreen('setup');
          }}
        />
      )}
      {screen === 'home' && (
        <HomeScreen
          hasGame={!!s}
          records={records}
          recordError={recordError}
          onSetup={() => setScreen('setup')}
          onContinue={() => setScreen('game')}
        />
      )}
      {screen === 'setup' && <SetupScreen picker={picker} hasGame={!!s} onStart={newGame} />}
      {screen === 'game' && s?.introPending && (
        <FounderIntro
          s={s}
          onBegin={() => {
            beginStory();
            setTab('story');
            window.scrollTo(0, 0);
          }}
          error={error}
          saved={saved}
        />
      )}
      {screen === 'game' && s && !s.introPending && (
        <GameScreen
          s={s}
          records={records}
          recordError={recordError}
          error={error}
          saved={saved}
          tab={tab}
          setTab={setTab}
          overview={overview}
          setOverview={setOverview}
          animateResult={animateResult}
          setAnimateResult={setAnimateResult}
          onPerson={setPerson}
          onReplay={replay}
          onNewStory={() => setScreen('setup')}
        />
      )}
      {screen === 'about' && <AboutScreen onBack={() => setScreen(s ? 'game' : 'home')} />}
      <footer>
        <span>
          千年家門 <b>천년가문</b>
        </span>
        <p>모든 인물과 가족의 이야기는 허구입니다.</p>
        <button
          onClick={() => {
            setNotice(
              '이 브라우저에서 자동 저장됩니다. 연대기에서 JSON 기록을 내보낼 수 있습니다.',
            );
          }}
        >
          저장 안내
        </button>
      </footer>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button onClick={() => setNotice('')}>닫기</button>
        </div>
      )}
      {person && s && <PersonDialog p={person} s={s} onClose={closePerson} />}
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
