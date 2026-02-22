import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'happy-dom',
        globals: true,
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.{test,spec}.{js,ts,tsx}'],
        exclude: ['tests/e2e/**', 'tests/integration/agent-simulation.test.ts', 'node_modules/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                '.next/',
                'tests/setup.ts',
                'tests/e2e/**',
                '**/*.config.{ts,js}',
                '**/types.ts',
            ],
            thresholds: {
                // Target 70% coverage; minimums reflect current baseline
                lines: 50,
                functions: 50,
                branches: 45,
                statements: 50,
            },
        },
        testTimeout: 10000,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
