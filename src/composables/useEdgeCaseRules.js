export const edgeCaseRules = [
  {
    operation: 'division',
    check: (q) => (q.operation === '÷' || q.operatorSymbol === '÷') && q.num1 === 0,
    key: 'zeroDivision'
  },
  {
    operation: 'division',
    check: (q) => (q.operation === '÷' || q.operatorSymbol === '÷') && q.num2 === 1,
    key: 'divideByOne'
  },
  {
    operation: 'division',
    check: (q) => (q.operation === '÷' || q.operatorSymbol === '÷') && q.num1 === q.num2,
    key: 'oneDivision'
  },
  {
    operation: 'multiplication',
    check: (q) => (q.operation === '×' || q.operatorSymbol === '×') && q.num1 === 0 && q.num2 === 0,
    key: 'zeroZeroMultiplication',
    skip: true
  },
  {
    operation: 'multiplication',
    check: (q) => (q.operation === '×' || q.operatorSymbol === '×') && (q.num2 === 0 || q.num1 === 0),
    key: 'zeroMultiplication'
  },
  {
    operation: 'multiplication',
    check: (q) => (q.operation === '×' || q.operatorSymbol === '×') && (q.num2 === 1 || q.num1 === 1),
    key: 'oneMultiplication'
  },
  {
    operation: 'addition',
    check: (q) => (q.operation === '+' || q.operatorSymbol === '+') && q.num1 === 0 && q.num2 === 0,
    key: 'zeroZeroAddition',
    skip: true
  },
  {
    operation: 'addition',
    check: (q) => (q.operation === '+' || q.operatorSymbol === '+') && (q.num2 === 0 || q.num1 === 0),
    key: 'zeroAddition'
  },
  {
    operation: 'addition',
    check: (q) => (q.operation === '+' || q.operatorSymbol === '+') && (q.num2 === 1 || q.num1 === 1),
    key: 'oneAddition'
  },
  {
    operation: 'subtraction',
    check: (q) => (q.operation === '-' || q.operatorSymbol === '-') && q.num1 === 0 && q.num2 === 0,
    key: 'zeroZeroSubtraction',
    skip: true
  },
  {
    operation: 'subtraction',
    check: (q) => (q.operation === '-' || q.operatorSymbol === '-') && q.num2 === 0,
    key: 'zeroSubtraction'
  },
  {
    operation: 'subtraction',
    check: (q) => (q.operation === '-' || q.operatorSymbol === '-') && q.num2 === 1,
    key: 'oneSubtraction'
  },
  {
    operation: 'subtraction',
    check: (q) => (q.operation === '-' || q.operatorSymbol === '-') && q.num1 === q.num2 && q.num1 !== 0,
    key: 'equalSubtraction'
  }
]

export function checkEdgeCases(item, availableOperations, edgeCaseTracker) {
  for (const rule of edgeCaseRules) {
    if (availableOperations.includes(rule.operation) && rule.check(item)) {
      if (rule.skip) {
        return { shouldSkip: true }
      }
      if (edgeCaseTracker[rule.key]) {
        return { shouldSkip: true }
      }
      edgeCaseTracker[rule.key] = true
    }
  }
  return { shouldSkip: false }
}
