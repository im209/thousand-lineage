import {it,expect} from 'vitest';
import {withParticle} from './korean';
it('chooses Korean particles including the rieul exception',()=>{
 expect(withParticle('김민준','과/와')).toBe('김민준과');expect(withParticle('김순이','과/와')).toBe('김순이와');
 expect(withParticle('김덕수','이/가')).toBe('김덕수가');expect(withParticle('김서연','이/가')).toBe('김서연이');
 expect(withParticle('한양','으로/로')).toBe('한양으로');expect(withParticle('서울','으로/로')).toBe('서울로');expect(withParticle('나루','으로/로')).toBe('나루로');
});
