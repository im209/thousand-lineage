import { EndingCatalog, ChroniclePanel } from '../chronicle-panels';
import { clans, era, labels } from '../data';
import {
  chapterOf,
  representativeNumber,
  societyState,
  summary,
  type Person,
  type State,
} from '../engine';
import { FamilyTree } from '../family-tree';
import { Avatar, FamilyStrip, HeirSelection, QuickStats, TurnResult } from '../game-panels';
import { GrowthGuide } from '../growth-guide';
import { StoryStage, FirstChoiceGuide } from '../play-flow';
import { FamilyOutlook } from '../progression-panels';
import type { RunRecords } from '../records';
import { SocietyPanel } from '../society-panels';
import { statMeaning } from '../stat-meaning';
import { useGame } from '../store';
import { ChapterCard } from './chapter-card';
import { ChronicleLog, RecentLog } from './chronicle-log';
import { EndingCard } from './ending-card';
import { EventCard } from './event-card';

export type GameTab = 'story' | 'society' | 'lives' | 'endings' | 'tree' | 'chronicle';

const detailTabs: [GameTab, string][] = [
  ['society', '신분·권력'],
  ['lives', '조선의 삶'],
  ['endings', '결말 도감'],
  ['tree', '가계도'],
  ['chronicle', '연대기'],
];

/** The current head of the family, shown in the side column of 가문 살펴보기. */
function HeadAside({ s, onPerson }: { s: State; onPerson: (p: Person) => void }) {
  const h = s.people[s.head];
  return (
    <aside>
      <p className="eyebrow">{h.alive ? '지금, 가문을 이끄는 사람' : '이야기를 남긴 이전 대표'}</p>
      <button className="head-card" onClick={() => onPerson(h)}>
        <div className="portrait">
          <Avatar person={h} size={76} />
        </div>
        <h2>
          {h.alive ? '' : '故 '}
          {h.name}
        </h2>
        <p>
          {h.alive ? `${h.born}년생 · ${s.year - h.born}세` : `${h.born}–${h.died}년`} · {h.sex}
        </p>
        <div className="tags">
          <span>{h.job}</span>
          <span>{h.region}</span>
          <span>{h.trait}</span>
        </div>
      </button>
      <div className="lineage-note">
        <b>시작한 가문 · {clans[s.clan].label}</b>현재 대표 · {clans[h.clan].label}
        <br />
        {h.id === s.founder
          ? '이 이야기의 첫 인물입니다.'
          : h.clan === s.clan
            ? '창시자와 같은 성씨·본관의 후손입니다.'
            : '성씨는 달라도 창시자의 계보를 잇는 후손입니다.'}
      </div>
      <div className="stats">
        {Object.entries(labels).map(([key, label]) => (
          <div key={key}>
            <span>{label}</span>
            <b>
              {Math.round(s.stats[key as keyof typeof labels])}
              {key === 'wealth' ? '섬' : ''}
            </b>
            <div className="bar">
              <i style={{ width: `${s.stats[key as keyof typeof labels]}%` }} />
            </div>
            <small className="stat-meaning">{statMeaning(s, key as keyof typeof labels)}</small>
          </div>
        ))}
      </div>
      <p className="tiny">
        재산은 쌀 섬으로 세고(최대 100섬), 나머지는 0–100입니다.
        <br />
        실제 화폐나 인구 통계가 아닙니다.
      </p>
    </aside>
  );
}

export function GameScreen({
  s,
  records,
  recordError,
  error,
  saved,
  tab,
  setTab,
  overview,
  setOverview,
  animateResult,
  setAnimateResult,
  onPerson,
  onReplay,
  onNewStory,
}: {
  s: State;
  records: RunRecords;
  recordError: string;
  error: string;
  saved: boolean;
  tab: GameTab;
  setTab: (tab: GameTab) => void;
  overview: boolean;
  setOverview: (open: boolean) => void;
  animateResult: boolean;
  setAnimateResult: (animate: boolean) => void;
  onPerson: (p: Person) => void;
  onReplay: () => void;
  onNewStory: () => void;
}) {
  const {
    choose,
    succeed,
    continueStory,
    continueFuture,
    selectProject,
    selectSocialFocus,
    selectChronicle,
  } = useGame();
  const h = s.people[s.head];
  const result = summary(s);
  // An era summary takes over the stage until it is dismissed.
  const idle = !s.report && !s.chapterEnd;
  const openTab = (next: GameTab) => {
    setOverview(true);
    setTab(next);
  };
  return (
    <main className={`game ${tab === 'story' && !overview ? 'focused-game' : ''}`}>
      <div className="game-heading">
        <div>
          <p className="eyebrow">{clans[s.clan].label}에서 시작한 가문의 기록</p>
          <h1>
            {s.year}
            <small>년</small>
            <span>
              {s.year > 2026
                ? '가상의 미래'
                : societyState(s).alternate
                  ? '대체역사'
                  : (chapterOf(s.year)?.title ?? era(s.year))}
            </span>
          </h1>
        </div>
        <div className="generation">
          <b>{representativeNumber(s)}</b>번째 가문 대표
          <small>
            창시자의 {h.generation}세대 · {result.years}년의 기록
          </small>
        </div>
      </div>
      <div className="timeline-progress">
        <i style={{ width: `${Math.min(100, ((s.year - 1392) / 634) * 100)}%` }} />
      </div>
      <div className="tabs focused-tabs">
        <button className={tab === 'story' ? 'active' : ''} onClick={() => setTab('story')}>
          이야기
        </button>
        <button
          className="overview-toggle"
          aria-expanded={overview}
          aria-controls="family-navigation"
          onClick={() => {
            setOverview(!overview);
            if (overview) setTab('story');
          }}
        >
          가문 살펴보기 {overview ? '−' : '+'}
        </button>
        <div id="family-navigation" className="family-navigation" hidden={!overview}>
          {detailTabs.map(([id, label]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
        <span className={saved ? 'save-state' : 'save-state unsaved'}>
          {saved ? '● 자동 저장됨' : '◌ 저장 상태 확인 필요'}
        </span>
      </div>
      {error && (
        <p className="save-warning" role="alert">
          {error}
        </p>
      )}
      {s.endless && (
        <div className="future-banner">
          <strong>아직 쓰이지 않은 미래</strong>
          <span>2026년 이후는 창작입니다. 연도 제한 없이, 후손이 이어지는 동안 계속됩니다.</span>
        </div>
      )}
      {societyState(s).alternate && (
        <div className="alternate-banner">
          대체역사 분기 · 이후 실제 연표는 참고 배경이며, 가문의 정치적 행보는 창작입니다.
        </div>
      )}
      {tab === 'story' && overview && (
        <>
          <QuickStats s={s} />
          <FamilyStrip s={s} onPerson={onPerson} />
        </>
      )}
      {tab === 'story' && (
        <div className="game-columns">
          {overview && <HeadAside s={s} onPerson={onPerson} />}
          <section className="story-content">
            <StoryStage s={s}>
              <FirstChoiceGuide s={s} onPerson={onPerson} />
              <FamilyOutlook s={s} />

              {s.report && (
                <TurnResult
                  s={s}
                  animate={animateResult}
                  onPerson={onPerson}
                  onContinue={() => {
                    setAnimateResult(false);
                    setOverview(false);
                    continueStory();
                  }}
                />
              )}
              {!s.report && s.chapterEnd && (
                <ChapterCard
                  s={s}
                  onContinue={() => {
                    setOverview(false);
                    continueStory();
                  }}
                />
              )}
              {idle && s.phase === 'play' && (
                <EventCard
                  s={s}
                  onChoose={i => {
                    setAnimateResult(true);
                    setOverview(false);
                    choose(i);
                  }}
                />
              )}
              {idle && s.phase === 'succession' && (
                <HeirSelection
                  s={s}
                  onSelect={id => {
                    setOverview(false);
                    succeed(id);
                  }}
                  onPerson={onPerson}
                />
              )}
              {idle && s.phase === 'ended' && (
                <EndingCard
                  s={s}
                  records={records}
                  recordError={recordError}
                  onShowEndings={() => openTab('endings')}
                  onContinueFuture={() => {
                    setOverview(false);
                    continueFuture();
                  }}
                  onReplay={onReplay}
                  onNewStory={onNewStory}
                />
              )}
            </StoryStage>
            {s.phase === 'play' && idle && !s.journey && (
              <GrowthGuide
                s={s}
                onSelect={id => {
                  selectProject(id);
                  const stage = document.querySelector<HTMLElement>('.story-stage');
                  stage?.focus({ preventScroll: true });
                  stage?.scrollIntoView({ block: 'start' });
                }}
                onDirections={() => openTab('society')}
                onLives={() => openTab('lives')}
              />
            )}
            {s.turn > 0 && idle && <RecentLog s={s} onOpenChronicle={() => openTab('chronicle')} />}
          </section>
        </div>
      )}
      {tab === 'society' && (
        <SocietyPanel s={s} onFocus={selectSocialFocus} onReturn={() => setTab('story')} />
      )}
      {tab === 'lives' && (
        <ChroniclePanel s={s} onSelect={selectChronicle} onReturn={() => setTab('story')} />
      )}
      {tab === 'endings' && <EndingCatalog records={records} s={s} error={recordError} />}
      {tab === 'tree' && <FamilyTree s={s} onPerson={onPerson} />}
      {tab === 'chronicle' && <ChronicleLog s={s} />}
    </main>
  );
}
