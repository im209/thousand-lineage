// What each stat is doing for this family right now, in plain numbers taken from the same
// formulas the engine uses. Shown next to every stat so nothing works out of sight.
import {
  birthFactor,
  household,
  mortalityFactor,
  workFactor,
  yearlyFood,
  yearlyIncome,
} from './engine';
import type { State } from './engine';
import type { Stat } from './stats';

const times = (n: number) => `${n.toFixed(2)}배`;

export function statMeaning(s: State, stat: Stat): string {
  switch (stat) {
    case 'wealth':
      return `식구 ${household(s).length}명 · 한 해에 ${yearlyIncome(s).toFixed(1)}섬 벌고 ${yearlyFood(s).toFixed(1)}섬 먹어요`;
    case 'health':
      return `병과 노환으로 가족을 잃을 위험 ${times(mortalityFactor(s))} · 벌이 ${times(workFactor(s))}`;
    case 'cohesion':
      return `아이가 태어날 가능성 ${times(birthFactor(s))}`;
    case 'education':
      return '태어나는 아이가 이만큼 배우고 시작해요 · 과거 합격 확률에 반영';
    case 'reputation': {
      const shift = Math.round((s.stats.reputation - 50) * 0.4);
      const trade =
        s.stats.reputation >= 60 ? '큰 거래 밑천 8→3섬 적용 중' : '60이 되면 큰 거래 밑천 8→3섬';
      return `송사·큰 거래 성공 확률 ${shift >= 0 ? '+' : '−'}${Math.abs(shift)}%p · ${trade}`;
    }
  }
}
