# PR 리뷰 알림(NEW 배지) 설정 가이드

`index.htm`의 PR 섹션은 저장소 링크 옆에, 내가 리뷰해야 할 PR이 있으면 반짝이는
**NEW** 배지를 띄워줍니다. 이 문서는 그 기능을 쓰기 위해 **각자 자신의 계정으로**
해야 하는 설정을 안내합니다.

## 동작 원리 (한눈에)

```
GitHub Actions (15분마다, cron)
  └─ 내 GitHub 토큰으로 Search API 호출
       "OBIGOGIT의 각 저장소에서 내가 리뷰 요청받은 open PR 개수"
  └─ 결과를 webdata/pr_review_counts.json 에 커밋

index.htm (브라우저)
  └─ webdata/pr_review_counts.json 만 읽음 (GitHub API 직접 호출 안 함)
  └─ 개수 > 0 인 저장소 링크 옆에 NEW 배지 표시
```

토큰은 **GitHub 저장소의 Actions secret**에만 저장되고, 브라우저에는 절대
전달되지 않습니다. 즉 이 저장소를 fork/clone해서 쓰는 사람은 아래 절차대로
**자기 계정의 토큰**을 자기 저장소의 secret에 등록해야 자신 기준의 리뷰 알림을
받을 수 있습니다.

> ⚠️ 이 워크플로우는 secret 1개(`PR_REVIEW_PAT`)만 쓰기 때문에, 한 저장소에
> secret을 등록한 사람 1명 기준으로만 카운트가 갱신됩니다. 팀원 여러 명이
> "각자 자신 기준"의 배지를 보려면, 각자 이 저장소를 자신의 계정으로
> fork(또는 별도 사본)해서 그 fork에 자신의 토큰을 등록해야 합니다.

## 1. GitHub Personal Access Token 발급

1. https://github.com/settings/tokens 접속
2. **Generate new token → Generate new token (classic)** 클릭
   - ⚠️ **Fine-grained token은 사용하지 마세요.** GitHub Search API
     (`/search/issues`)를 아직 완전히 지원하지 않아서 `422 Unprocessable Entity`
     오류가 발생합니다. 반드시 **classic** 토큰을 사용하세요.
3. Note(이름)에 알아보기 쉬운 이름 입력 (예: `pr-review-badge`)
4. Expiration(만료일)은 원하는 대로 설정 (계속 쓰려면 No expiration 또는 긴 기간)
5. Scopes에서 **`repo`** 최상위 체크박스 체크 (하위 항목 전부 포함됨 — private repo
   접근에 필요)
6. **Generate token** 클릭 → `ghp_...`로 시작하는 문자열이 **딱 한 번만** 표시됩니다.
   반드시 이 화면을 벗어나기 전에 복사해두세요.

### OBIGOGIT 조직이 SSO(SAML)를 강제하는 경우
토큰 생성 직후 목록 화면에서 방금 만든 토큰 옆에 **"Configure SSO"** 버튼이
보이면, 클릭 후 **OBIGOGIT** 옆의 **Authorize** 버튼을 눌러야 조직 저장소에
접근할 수 있습니다. 버튼이 안 보이면 이 단계는 필요 없습니다.

## 2. 저장소 Secret 등록

1. 자신의 저장소(fork 또는 이 저장소) 접속
2. **Settings → Secrets and variables → Actions** 이동
   (URL 직접 이동: `https://github.com/<내계정>/<저장소>/settings/secrets/actions`)
3. **Repository secrets** 섹션의 **New repository secret** 클릭
4. 입력:
   - **Name**: `PR_REVIEW_PAT` (워크플로우 파일의 이름과 정확히 일치해야 함,
     대소문자까지 동일하게)
   - **Secret**: 1단계에서 복사한 `ghp_...` 값
5. **Add secret** 클릭

등록 후에는 값이 다시 표시되지 않고, Actions 로그에도 자동으로 마스킹되어
노출되지 않습니다.

## 3. 대상 저장소 목록 확인/수정 (선택)

`.github/workflows/pr-review-counts.yml` 안의 `repos=(...)` 배열이 카운트를 조회할
저장소 목록입니다. `index.htm`의 `PR_REPOS` 배열과 항상 같은 목록을 유지해야
배지가 정확히 매칭됩니다. 다른 저장소를 조회하고 싶다면 두 곳을 함께 수정하세요.

## 4. 동작 확인

1. GitHub 저장소의 **Actions** 탭 → **Update PR review counts** 워크플로우 선택
2. 우측 **Run workflow** 버튼으로 수동 실행
3. 실행이 성공(초록 체크)하면 `webdata/pr_review_counts.json` 파일이 자동으로
   갱신·커밋됩니다
4. GitHub Pages 배포(수 분 소요)가 끝난 뒤 사이트에서 리뷰 대기 PR이 있는
   저장소 옆에 NEW 배지가 뜨는지 확인

이후에는 15분마다 자동으로 갱신됩니다. (GitHub의 스케줄 트리거는 부하 상황에
따라 다소 지연될 수 있습니다.)

## 문제 해결

| 증상 | 원인 | 해결 |
|---|---|---|
| Actions 로그에 `422` | Fine-grained 토큰 사용 중 | Classic 토큰으로 재발급 후 secret 값 교체 |
| Actions 로그에 `403` | 조직 SSO 미인가 / secondary rate limit | 위 "SSO" 안내대로 Authorize, 또는 몇 분 뒤 재시도 |
| Actions 로그에 `404` (`gh: Not Found`) | `gh api`가 `-f` 사용 시 기본 POST로 요청 | 워크플로우가 이미 `--method GET`을 명시하도록 되어 있는지 확인 |
| 배지가 계속 안 뜸 | secret 이름 오타, `PR_REPOS`/`repos` 목록 불일치 | secret 이름이 `PR_REVIEW_PAT`인지, 두 목록이 일치하는지 확인 |
