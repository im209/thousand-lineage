import { useState } from 'react';
import { clanCoverage, clans, searchClans } from '../data';
import { randomClanIndex } from '../share-links';
import { BackgroundFate } from '../society-panels';

const PAGE = 40;

/** Clan search state. Lives in App so a chosen clan survives switching screens. */
export function useClanPicker() {
  const [search, setSearch] = useState('');
  const [clan, setClan] = useState(-1);
  const [limit, setLimit] = useState(PAGE);
  const [randomPicked, setRandomPicked] = useState(false);
  return { search, setSearch, clan, setClan, limit, setLimit, randomPicked, setRandomPicked };
}
export type ClanPicker = ReturnType<typeof useClanPicker>;

export function SetupScreen({
  picker,
  hasGame,
  onStart,
}: {
  picker: ClanPicker;
  hasGame: boolean;
  onStart: () => void;
}) {
  const { search, setSearch, clan, setClan, limit, setLimit, randomPicked, setRandomPicked } =
    picker;
  const matches = searchClans(search);
  return (
    <main className="setup">
      <p className="eyebrow">새로운 이야기</p>
      <h1>
        당신의 가문을
        <br />
        찾아보세요.
      </h1>
      <p className="muted">내 성씨를 입력해 보세요. 잘 모르겠다면 운명에 맡겨도 돼요.</p>
      <label className="search-label" htmlFor="clan-search">
        성씨 · 본관
      </label>
      <input
        id="clan-search"
        autoFocus
        autoComplete="off"
        aria-label="성씨 본관 검색"
        placeholder="예: 김, 김해, 전주 이씨"
        value={search}
        onChange={e => {
          setRandomPicked(false);
          setSearch(e.target.value);
          setClan(-1);
          setLimit(PAGE);
        }}
      />
      {search.trim() && (
        <div className="search-results" aria-label="본관 검색 결과">
          {matches.slice(0, limit).map(c => (
            <button
              key={c.id}
              onClick={() => {
                setRandomPicked(false);
                setClan(c.id);
                setSearch('');
                requestAnimationFrame(() =>
                  document
                    .querySelector<HTMLElement>('.setup>.primary')
                    ?.scrollIntoView({ block: 'center' }),
                );
              }}
            >
              <span>
                <strong>{c.label}</strong>
                <small>{c.hanja}</small>
              </span>
              <span>선택 →</span>
            </button>
          ))}
          {!matches.length && (
            <p role="status">공개 자료에서 찾지 못했습니다. 성씨나 본관을 짧게 입력해 보세요.</p>
          )}
          <p role="status">
            검색 결과 {matches.length.toLocaleString()}개 · {Math.min(limit, matches.length)}개 표시
          </p>
          {matches.length > limit && (
            <button className="load-more" onClick={() => setLimit(limit + PAGE)}>
              40개 더 보기 ↓
            </button>
          )}
        </div>
      )}
      <div className="random-clan">
        <button
          onClick={() => {
            setClan(randomClanIndex(clans.length));
            setSearch('');
            setRandomPicked(true);
          }}
        >
          운명에 맡기기 · 랜덤 가문 ↻
        </button>
      </div>
      {clan >= 0 && (
        <div className="selected-clan">
          <span>
            <small>선택한 가문</small>
            <strong>{clans[clan].label}</strong>
          </span>
          <button
            onClick={() => {
              setClan(-1);
              document.getElementById('clan-search')?.focus();
            }}
          >
            변경
          </button>
        </div>
      )}
      {clan >= 0 && randomPicked && (
        <p className="random-clan-note" role="status">
          운명이 고른 가문은 {clans[clan].label}입니다. 아래에서 확인한 뒤 시작하세요.
        </p>
      )}
      {clan >= 0 && <BackgroundFate />}
      {clan >= 0 && (
        <>
          <p className="setup-hint">다음 화면에서 가문을 시작할 첫 인물을 만나요.</p>
          <button
            className="primary"
            onClick={onStart}
          >{`${clans[clan].label}의 이야기 시작 →`}</button>
        </>
      )}
      {hasGame && <p className="warning">새 이야기를 시작하면 기존 자동 저장 기록이 교체됩니다.</p>}
      <p className="tiny">
        성씨 {clanCoverage.surnameCount}개 · 본관 {clanCoverage.namedCount.toLocaleString()}개 (2015
        통계청 공개 자료, 5인 이상) · 실제 족보가 아닌 가상의 이야기입니다.
      </p>
    </main>
  );
}
