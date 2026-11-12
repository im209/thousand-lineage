/** Pick a Korean particle from the final Hangul syllable. Non-Hangul names use
 * the vowel form rather than exposing placeholder text such as 이(가). */
export function withParticle(name:string,pair:'은/는'|'이/가'|'을/를'|'과/와'|'으로/로') {
 const code=name.trim().codePointAt(name.trim().length-1)??0;
 const jong=code>=0xac00&&code<=0xd7a3?(code-0xac00)%28:0;
 const [consonant,vowel]=pair.split('/');
 return name+(jong!==0&&!(pair==='으로/로'&&jong===8)?consonant:vowel);
}
