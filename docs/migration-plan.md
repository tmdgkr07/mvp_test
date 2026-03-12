# 마이그레이션 순서

## Phase 1. 워크스페이스 생성

실행 완료

1. `mvp_platform` 루트를 만든다.
2. `apps/dashboard-web`에 기존 `mvp_final` 코드를 복사한다.
3. `apps/widget-cdn`에 기존 `embed_test` 코드를 복사한다.
4. 루트 `package.json`에 npm workspaces를 설정한다.

## Phase 2. 공통 패키지 연결

실행 완료

1. `packages/shared`를 만든다.
2. 위젯 런타임 경로와 URL 생성 함수를 공통 패키지로 이동한다.
3. `dashboard-web`, `widget-cdn`이 둘 다 이 패키지를 import하도록 바꾼다.

## Phase 3. 설정 정리

실행 완료

1. 앱별 `package.json` 이름을 workspace 기준으로 변경한다.
2. 앱별 `next.config.mjs`에 `transpilePackages`와 monorepo tracing root를 넣는다.
3. 앱별 `tsconfig.json`이 루트 `tsconfig.base.json`을 상속하게 바꾼다.

## Phase 4. 검증

실행 완료

1. 루트에서 `npm install`
2. 루트에서 `npm run typecheck`
3. 루트에서 `npm run build`
4. 필요 시 각 앱을 개별 실행해 로컬 동작 확인

## Phase 5. 후속 권장 작업

아직 미실행

1. `packages/backend-core` 추출로 `dashboard-web` / `public-api` 중복 제거
2. `bootstrap -> short-lived embed session` 구조 도입
3. analytics rollup/queue 계층 추가
4. Vercel monorepo root directory 기준으로 각 앱 재배포
