// @ts-check

/** Matches constructor names treated as errors, e.g. `Error`, `TypeError`, or `AngError`. */
const ERROR_NAME = /Error$/;

/**
 * Checks whether an expression reads the `ngDevMode` global.
 *
 * @param {import('estree').Node} node Expression to check.
 * @returns {boolean} `true` when `ngDevMode` appears in the expression.
 */
function readsDevMode(node) {
  switch (node.type) {
    case 'Identifier':
      return node.name === 'ngDevMode';
    case 'UnaryExpression':
      return readsDevMode(node.argument);
    case 'BinaryExpression':
    case 'LogicalExpression':
      return readsDevMode(node.left) || readsDevMode(node.right);
    default:
      return false;
  }
}

/**
 * Checks whether a statement exits unless an `ngDevMode` check passes, i.e. `if (!ngDevMode) { return; }`.
 *
 * @param {import('estree').Node} node Statement to check.
 * @returns {boolean} `true` for an early-return dev-mode guard.
 */
function isDevModeEarlyReturn(node) {
  if (node.type !== 'IfStatement' || node.test.type !== 'UnaryExpression' || node.test.operator !== '!') {
    return false;
  }

  const exit = node.consequent.type === 'BlockStatement' ? node.consequent.body.at(-1) : node.consequent;
  return exit?.type === 'ReturnStatement' && readsDevMode(node.test.argument);
}

/**
 * Checks whether a node only runs when an `ngDevMode` check passes: in the consequent of an `if` or conditional, on
 * the right of `&&`, or after an early-return guard, whose condition reads `ngDevMode`.
 *
 * @param {import('eslint').Rule.Node} node Node to check.
 * @returns {boolean} `true` when the node is guarded by `ngDevMode`.
 */
function isDevModeGuarded(node) {
  for (let child = node; child.parent; child = child.parent) {
    const { parent } = child;
    if (
      ((parent.type === 'IfStatement' || parent.type === 'ConditionalExpression') &&
        parent.consequent === child &&
        readsDevMode(parent.test)) ||
      (parent.type === 'LogicalExpression' &&
        parent.operator === '&&' &&
        parent.right === child &&
        readsDevMode(parent.left)) ||
      (parent.type === 'BlockStatement' &&
        parent.body
          .slice(0, parent.body.indexOf(/** @type {import('estree').Statement} */ (child)))
          .some(isDevModeEarlyReturn))
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Collects the non-empty string literals and template literals an argument can evaluate to or concatenate. Strings in
 * comparisons, such as `typeof ngDevMode === 'undefined'`, are skipped.
 *
 * @param {import('estree').Node} node Argument expression.
 * @returns {import('estree').Node[]} The string nodes.
 */
function collectStrings(node) {
  switch (node.type) {
    case 'Literal':
      return typeof node.value === 'string' && node.value !== '' ? [node] : [];
    case 'TemplateLiteral':
      return [node];
    case 'ConditionalExpression':
      return [...collectStrings(node.consequent), ...collectStrings(node.alternate)];
    case 'LogicalExpression':
      return [...collectStrings(node.left), ...collectStrings(node.right)];
    case 'BinaryExpression':
      return node.operator === '+' ? [...collectStrings(node.left), ...collectStrings(node.right)] : [];
    default:
      return [];
  }
}

/**
 * Disallows string messages in error constructors unless they are guarded by `ngDevMode`, so production bundles do
 * not ship dev-only error text.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require error message strings to be guarded by `ngDevMode` so production builds can drop them',
    },
    messages: {
      unguarded:
        'Error message strings ship in production bundles. Guard them with `ngDevMode`, e.g. `new AngError(code, (typeof ngDevMode === "undefined" || ngDevMode) && "message")`.',
    },
    schema: [],
  },
  create(context) {
    /**
     * Reports string arguments of error constructors that are not guarded by `ngDevMode`.
     *
     * @param {import('estree').NewExpression | import('estree').CallExpression} node Constructor or call expression.
     */
    const check = (node) => {
      if (node.callee.type !== 'Identifier' || !ERROR_NAME.test(node.callee.name)) {
        return;
      }

      for (const string of node.arguments.flatMap(collectStrings)) {
        if (!isDevModeGuarded(/** @type {import('eslint').Rule.Node} */ (string))) {
          context.report({ node: string, messageId: 'unguarded' });
        }
      }
    };

    return { NewExpression: check, CallExpression: check };
  },
};

export default rule;
