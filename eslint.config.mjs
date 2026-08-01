import next from 'eslint-config-next'

export default [
  ...(Array.isArray(next) ? next : [next]),
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
]
