# 폴더 설계안

## 목표

- 위젯 배포와 관리자 앱 배포는 분리한다.
- 공통 타입과 런타임 규칙은 한 곳에서 관리한다.
- 현재 운영 중인 `mvp_final` 기능을 보존하면서, 이후 `public-api`를 별도 앱으로 뽑을 수 있게 준비한다.

## 제안 구조

```text
mvp_platform/
  apps/
    dashboard-web/
      app/
      components/
      lib/
      prisma/
      public/
      scripts/
    public-api/
      app/
      components/
      lib/
      prisma/
    widget-cdn/
      app/
      public/
  packages/
    shared/
      src/
        index.ts
        runtime.ts
  docs/
    folder-design.md
    migration-plan.md
  package.json
  tsconfig.base.json
  remember.md
```

## 역할 분리

### `apps/dashboard-web`

- 로그인
- 서비스 허브
- 관리자 페이지
- 임베드 토큰 발급
- Prisma/DB 관리

### `apps/widget-cdn`

- `widget.js`
- `v1/widget.js`
- 위젯 배포 상태 확인용 랜딩 페이지

### `apps/public-api`

- `track`
- `create-payment`
- `confirm-payment`
- `local-checkout`
- `success`
- `fail`

### `packages/shared`

- 위젯 엔트리 경로
- 위젯 URL 생성 규칙
- 향후 공통 타입, 토큰 스키마, 응답 DTO 추가 위치

## 다음 단계 확장 포인트

- 현재 `public-api`는 런타임 경로만 우선 분리했고, 내부 비즈니스 로직과 Prisma schema는 아직 `dashboard-web`과 일부 중복된다.
- 다음 리팩터링에서는 DB/결제/임베드 서비스 코어를 별도 패키지로 추출하는 것이 맞다.
