# 인물 도트 아바타

- 스타일: [DiceBear Pixel Art](https://www.dicebear.com/styles/pixel-art/)
- 제작자: DiceBear
- 아트: CC0 1.0. [라이선스 안내](https://www.dicebear.com/licenses/)
- 생성 코드: `@dicebear/core` 10.7.0, MIT. 스타일 정의: `@dicebear/styles` 10.6.0의 Pixel Art JSON만 사용

원격 API에 매번 요청하지 않고 고정된 패키지와 인물 ID·본관·출생연도·이름·성별을 바탕으로 브라우저 안에서 생성한다. 게임의 난수는 소비하지 않고 직업·현재 연도가 바뀌어도 얼굴은 유지한다. 그림만으로 성별이나 부모 역할을 추정하지 않도록 성별과 아버지·어머니 라벨을 별도로 표시한다.

`public/share-card.png`는 `node scripts/generate-share-card.mjs`로 로컬 벡터를 렌더링한 공유 미리보기 이미지다. 이 명령에는 기존 Playwright Chromium 설치가 필요하다. 개인 결과의 이미지 공유는 별도로 Canvas에 도트 초상과 기록을 그리며 결말 이름은 넣지 않는다.

## DiceBear core MIT 고지

MIT License

Copyright (c) 2026 Florian Körner

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
