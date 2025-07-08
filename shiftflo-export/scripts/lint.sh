#!/bin/bash

echo "🔍 Running TypeScript checks..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ TypeScript checks passed"
else
    echo "❌ TypeScript checks failed"
    exit 1
fi

echo "🔍 Running ESLint..."
npx eslint client/src --ext .ts,.tsx --quiet

if [ $? -eq 0 ]; then
    echo "✅ ESLint checks passed"
else
    echo "❌ ESLint checks failed"
    exit 1
fi

echo "🎉 All lint checks passed!"