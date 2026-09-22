# GitHub 게시 절차

이 저장소는 이미 `git init` 이 끝나 있고 커밋이 들어 있다(`git log` 로 확인).
따라서 **새로 초기화하지 말고** 원격만 연결해 푸시하면 된다.

---

## 0. 푸시 전에 정리할 것

### 0-1. 커밋 작성자 정보

공개 저장소에 커밋의 이메일이 그대로 노출된다. 개인 메일을 감추려면 **푸시 전에** 바꾼다.

```bash
git log --format='%an <%ae>' | sort -u      # 현재 작성자 확인
```

바꾸려면 새 값을 설정하고 기존 커밋을 모두 다시 쓴다(푸시 전에만 안전하다).

```bash
git config user.name  "Junhyuk Park"
git config user.email "junhpark@kigam.re.kr"        # 또는 GitHub noreply 주소
git rebase -r --root --exec "git commit --amend --no-edit --reset-author"
```

GitHub 이 발급하는 비공개 주소를 쓰려면 `계정 Settings → Emails → Keep my email addresses private`
를 켜고 거기 표시되는 `12345678+아이디@users.noreply.github.com` 을 쓰면 된다.

### 0-2. 라이선스

`LICENSE` 파일이 없으면 법적으로는 "모든 권리 유보"라 남이 쓸 수 없다. 오픈소스로 낼 생각이면
코드에 MIT 또는 Apache-2.0, 문서·그림에 CC BY 4.0 을 흔히 쓴다.
기관 산출물이면 공개 승인 절차를 먼저 밟는다.

### 0-3. 용량

저장소 전체 약 10 MB. GitHub 의 파일당 한도(100 MB)와 권장 저장소 크기(1 GB)에 한참 못 미친다.
OGS 원본 출력(`fields.bin`, `*.vtu`, 로그)은 `.gitignore` 로 빠져 있고, 참조해는 압축본(`fields.v2.bin.gz`, 12개 합계 약 6 MB)만 들어간다.

---

## 1. GitHub 에 빈 저장소 만들기

<https://github.com/new> 에서:

| 항목 | 값 |
|---|---|
| Repository name | `isl-studio` (원하는 이름) |
| Description | ISL 비교 시뮬레이터 프로토타입 |
| Public / Private | 아래 2절 참고 |
| Add a README file | **체크 해제** |
| Add .gitignore | **None** |
| Choose a license | **None** (0-2 에서 직접 넣는 편이 낫다) |

> 체크박스를 켜면 GitHub 쪽에 커밋이 하나 생겨 첫 푸시가 거부된다(`non-fast-forward`).
> 반드시 **완전히 빈** 저장소로 만든다.

만들고 나면 `https://github.com/<아이디>/<저장소>.git` 주소가 표시된다.

---

## 2. Public 과 Private 중 무엇으로 할까

| | Public | Private |
|---|---|---|
| 코드·문서 열람 | 누구나 | 초대한 사람만 |
| **GitHub Pages** | 무료 계정에서 가능 | **유료 플랜(Pro/Team/Enterprise) 필요** |
| Pages 로 낸 사이트 | 누구나 | (유료 플랜에서) 저장소 권한이 있는 사람만 |

즉 **무료 계정 + Private 이면 Pages 를 쓸 수 없다.**
기관 승인 전이라면 Private 으로 올려 두고, 승인 후 `Settings → General → Danger Zone → Change visibility`
에서 Public 으로 바꾼 다음 Pages 를 켜는 순서가 안전하다.

---

## 3. 푸시하기

압축을 푼 폴더에서 터미널을 연다.

```bash
cd isl-studio-repo
git remote add origin https://github.com/<아이디>/<저장소>.git
git branch -M main          # 이미 main 이면 아무 일도 하지 않는다
git push -u origin main
```

이미 `origin` 이 등록돼 있다면 `git remote set-url origin <주소>` 로 바꾼다.

### 인증 — 셋 중 하나

**(a) Personal Access Token (HTTPS, 가장 간단)**

2021년부터 계정 비밀번호로는 푸시할 수 없다. 토큰을 비밀번호 자리에 넣는다.

1. GitHub → 우측 상단 프로필 → `Settings` → 맨 아래 `Developer settings`
2. `Personal access tokens` → `Tokens (classic)` → `Generate new token (classic)`
3. Note 에 이름, Expiration 에 기한, 권한은 **`repo`** 하나만 체크
4. 생성된 `ghp_...` 문자열을 복사 (**이 화면을 벗어나면 다시 못 본다**)
5. `git push` 하면 뜨는 프롬프트에 Username = GitHub 아이디, Password = 복사한 토큰

macOS 는 Keychain, Windows 는 Credential Manager 가 한 번 입력하면 기억한다.
리눅스는 `git config --global credential.helper store` 로 저장할 수 있다(평문 저장이라 주의).

**(b) SSH 키 (반복 작업에 편함)**

```bash
ssh-keygen -t ed25519 -C "junhpark@kigam.re.kr"     # 기본 경로로 엔터, 암호는 선택
cat ~/.ssh/id_ed25519.pub                            # 출력을 복사
```
GitHub → `Settings` → `SSH and GPG keys` → `New SSH key` 에 붙여넣기. 그다음:
```bash
ssh -T git@github.com                                # "successfully authenticated" 확인
git remote set-url origin git@github.com:<아이디>/<저장소>.git
git push -u origin main
```

**(c) GitHub CLI (저장소 생성까지 한 번에)**

```bash
brew install gh          # macOS / winget install GitHub.cli / apt install gh
gh auth login            # 브라우저로 로그인
gh repo create isl-studio --private --source=. --remote=origin --push
```
이 한 줄이 1절의 저장소 생성과 3절의 푸시를 동시에 한다. `--private` 대신 `--public` 도 된다.

---

## 4. GitHub Pages 로 게시하기

저장소 루트에 `index.html` 과 `.nojekyll` 이 이미 들어 있으므로 설정만 켜면 된다.

1. 저장소 페이지 → `Settings` (저장소의 Settings, 계정 Settings 아님)
2. 왼쪽 사이드바 `Pages`
3. **Build and deployment** → Source: `Deploy from a branch`
4. Branch: `main`, 폴더: `/ (root)` → `Save`
5. 1~2분 뒤 같은 화면 상단에 주소가 뜬다:

```
https://<아이디>.github.io/<저장소>/
```

배포 진행 상황은 저장소 `Actions` 탭의 `pages build and deployment` 에서 볼 수 있다.

### 게시되는 것

| 주소 | 내용 |
|---|---|
| `/` | 안내 페이지 (`index.html`) |
| `/isl-studio-offline.html` | 시뮬레이터 (three.js 내장, 항상 동작) |
| `/isl-studio.html` | 시뮬레이터 (three.js 를 CDN 에서 로드) |
| `/docs/ISL-Studio-Manual.docx` | 사용 설명서 내려받기 |
| `/docs/ISL-Studio-Technical-Background.docx` | 기술 배경서 내려받기 |

`index.html` 아래쪽 `const REPO = "";` 한 줄에 저장소 주소를 넣으면
`.md` 링크가 GitHub 의 렌더링 화면으로 연결된다. 비워 두면 파일을 그대로 내려받는다.

### 주의

- **HTTPS 로 서비스된다.** `isl-studio.html` 이 쓰는 cdnjs 도 HTTPS 라 문제없지만,
  회의장 네트워크가 CDN 을 막는 경우가 있으니 시연에는 `-offline` 쪽 주소를 쓴다.
- `.nojekyll` 은 GitHub 가 파일을 Jekyll 로 변환하지 않고 그대로 내보내게 한다. 지우지 말 것.
- Private 저장소 + 무료 계정이면 Pages 설정 화면에 업그레이드 안내가 뜬다(2절 참고).
- 사용자 지정 도메인이 있으면 같은 화면의 `Custom domain` 에 넣고 DNS 에 CNAME 을 건다.

---

## 5. 이후 수정 사항 올리기

```bash
git add -A
git commit -m "설명서 수정"
git push
```

Pages 는 푸시할 때마다 자동으로 다시 배포된다(1~2분). 브라우저 캐시 때문에 바로 안 보이면
강력 새로고침(Ctrl/Cmd + Shift + R).

---

## 6. 자주 막히는 곳

| 증상 | 원인과 해결 |
|---|---|
| `Updates were rejected ... non-fast-forward` | GitHub 쪽에 README 등이 이미 있다. `git pull --rebase origin main` 후 다시 푸시, 또는 빈 저장소로 새로 만든다 |
| `remote: Support for password authentication was removed` | 비밀번호 대신 토큰을 넣어야 한다(3-a) |
| `Permission denied (publickey)` | SSH 키가 GitHub 에 등록되지 않았다(3-b) |
| Pages 주소가 404 | ① 배포가 아직 안 끝났다 ② Branch/폴더 설정이 `main` `/ (root)` 인지 확인 ③ 주소 끝 슬래시 확인 |
| 3D 화면이 안 뜸 | 브라우저 WebGL 미지원 또는 CDN 차단. `-offline` 판으로 접속 |
| 문서 파일이 안 보임 | `.gitignore` 가 `*.pdf`, `*.jpg` 를 제외한다. 필요하면 `git add -f <파일>` |
