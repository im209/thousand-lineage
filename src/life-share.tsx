// A square card for one remembered life: portrait, name, years, and the one line the
// family remembers them by. Made on the device; nothing is uploaded.
import { useState } from 'react';
import { clans } from './data';
import type { Life, State } from './engine';
import { avatarDataUrl } from './pixel-avatar';
import { isShareCancelled } from './share-links';

const SIZE = 1080;
const INK = '#2b2a33';

export async function lifeImage(s: State, life: Life): Promise<Blob> {
  const p = s.people[life.id];
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const c = canvas.getContext('2d');
  if (!c) return Promise.reject(Error('Canvas unavailable'));
  await document.fonts?.load('64px Galmuri11').catch(() => undefined);
  const font = (px: number) => `${px}px Galmuri11, sans-serif`;

  c.fillStyle = '#f6efdc';
  c.fillRect(0, 0, SIZE, SIZE);
  c.fillStyle = INK; // hard shadow
  c.fillRect(84, 84, 936, 936);
  c.fillStyle = '#fffcf3';
  c.fillRect(60, 60, 936, 936);
  c.lineWidth = 8;
  c.strokeStyle = INK;
  c.strokeRect(60, 60, 936, 936);

  const portrait = new Image();
  await new Promise<void>((resolve, reject) => {
    portrait.onload = () => resolve();
    portrait.onerror = () => reject(Error('Portrait failed'));
    portrait.src = avatarDataUrl(p);
  });
  c.imageSmoothingEnabled = false;
  c.drawImage(portrait, 408, 130, 240, 240);
  c.strokeRect(408, 130, 240, 240);

  c.textAlign = 'center';
  c.fillStyle = INK;
  c.font = font(72);
  c.fillText(`故 ${p.name}`, SIZE / 2 - 12, 480);
  c.fillStyle = '#7a7268';
  c.font = font(34);
  c.fillText(
    `${p.born}–${p.died ?? life.to}년 · ${(p.died ?? life.to) - p.born}세`,
    SIZE / 2 - 12,
    540,
  );

  // The remembered line, shrunk until it fits its box.
  let size = 76;
  do {
    c.font = font(size);
    size -= 4;
  } while (c.measureText(life.title).width > 760 && size > 36);
  const width = c.measureText(life.title).width + 80;
  c.fillStyle = '#fbecc4';
  c.fillRect(SIZE / 2 - 12 - width / 2, 610, width, 130);
  c.strokeRect(SIZE / 2 - 12 - width / 2, 610, width, 130);
  c.fillStyle = INK;
  c.fillText(life.title, SIZE / 2 - 12, 700);

  c.fillStyle = '#5a5560';
  c.font = font(32);
  const children = p.children.length;
  c.fillText(
    `대표로 ${life.to - life.from}년 · 선택 ${life.choices}번${children ? ` · 자녀 ${children}명` : ''}`,
    SIZE / 2 - 12,
    820,
  );
  c.fillStyle = '#c8452c';
  c.font = font(34);
  c.fillText(`千年家門 천년가문 · ${clans[s.clan].label}`, SIZE / 2 - 12, 930);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(Error('Image encoding failed'))),
      'image/png',
    ),
  );
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Share (where the device supports it) or save the card for one life. */
export function LifeShare({ s, life }: { s: State; life: Life }) {
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const name = `천년가문-${s.people[life.id].name}.png`;
  const make = async (share: boolean) => {
    setBusy(true);
    setNotice('');
    try {
      const blob = await lifeImage(s, life);
      const file = new File([blob], name, { type: 'image/png' });
      if (share && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `故 ${s.people[life.id].name} · ${life.title}`,
        });
        setNotice('공유창을 열었습니다.');
      } else {
        download(blob, name);
        setNotice('이미지를 저장했습니다.');
      }
    } catch (error) {
      setNotice(isShareCancelled(error) ? '공유를 취소했습니다.' : '이미지를 만들지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="life-share">
      <button disabled={busy} onClick={() => make(true)}>
        이 사람의 이야기 공유 ↗
      </button>
      <button disabled={busy} onClick={() => make(false)}>
        이미지 저장 ↓
      </button>
      {notice && (
        <small role="status" aria-live="polite">
          {notice}
        </small>
      )}
    </div>
  );
}
