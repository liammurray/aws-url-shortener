"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// [a-z 0–9 A-Z]
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const map = {};
for (let idx = 0; idx < CHARS.length; ++idx) {
    map[CHARS[idx]] = idx;
}
function decodeBase62(encoded) {
    const base = CHARS.length;
    let out = 0;
    for (const c of encoded) {
        out *= base;
        const val = map[c];
        if (val === undefined) {
            throw new Error(`Bad digit ${c} (should be [a-z 0–9 A-Z])`);
        }
        out += val;
    }
    return out;
}
exports.decodeBase62 = decodeBase62;
function encodeBase62(val) {
    const base = CHARS.length;
    const out = [];
    do {
        out.push(CHARS[val % base]);
        val = Math.floor(val / base);
    } while (val > 0);
    return out.reverse().join('');
}
exports.encodeBase62 = encodeBase62;
//# sourceMappingURL=encode.js.map