// @ts-check
import { RuleTester } from 'eslint';
import { afterAll, describe, it } from 'vitest';
import rule from './no-unguarded-error-message.js';

Object.assign(RuleTester, { afterAll, describe, it, itOnly: it.only });

const DEV = "(typeof ngDevMode === 'undefined' || ngDevMode)";

new RuleTester().run('no-unguarded-error-message', rule, {
  valid: [
    `if (${DEV}) { throw new Error('message'); }`,
    `if (ngDevMode) { effect(() => { throw new TypeError(\`message \${x}\`); }); }`,
    `throw new AngError(1, ${DEV} && 'message');`,
    `throw new AngError(1, ${DEV} ? 'message' : '');`,
    `throw new AngError(1);`,
    `throw new Error(message);`,
    `throw new Error('');`,
    `throw new AngError(1, ${DEV} && 'a: ' + value);`,
    `function f() { if (!${DEV}) { return; } throw new Error('message'); }`,
    `function f() { if (!ngDevMode) return; if (x) { throw new Error('message'); } }`,
    `throw new Wrapper('message');`,
    `throw new ns.Error('message');`,
  ],
  invalid: [
    { code: `throw new Error('message');`, errors: [{ messageId: 'unguarded' }] },
    // eslint-disable-next-line no-template-curly-in-string
    { code: 'throw Error(`message ${x}`);', errors: [{ messageId: 'unguarded' }] },
    { code: `throw new AngError(1, 'message');`, errors: [{ messageId: 'unguarded' }] },
    { code: `if (${DEV}) {} else { throw new Error('message'); }`, errors: [{ messageId: 'unguarded' }] },
    { code: `throw new AngError(1, ${DEV} ? '' : 'message');`, errors: [{ messageId: 'unguarded' }] },
    { code: `throw new AngError(1, 'message' && ${DEV});`, errors: [{ messageId: 'unguarded' }] },
    { code: `throw new Error('a: ' + value);`, errors: [{ messageId: 'unguarded' }] },
    { code: `throw new AngError(1, x ? 'a' : 'b');`, errors: [{ messageId: 'unguarded' }, { messageId: 'unguarded' }] },
    {
      code: `function f() { throw new Error('message'); if (!ngDevMode) { return; } }`,
      errors: [{ messageId: 'unguarded' }],
    },
    {
      code: `function f() { if (!ngDevMode) { log(); } throw new Error('message'); }`,
      errors: [{ messageId: 'unguarded' }],
    },
    {
      code: `function f() { if (ngDevMode) { return; } throw new Error('message'); }`,
      errors: [{ messageId: 'unguarded' }],
    },
    { code: `if (enabled) { throw new Error('message'); }`, errors: [{ messageId: 'unguarded' }] },
  ],
});
