# 🎪 AI 제작반 체험 부스

동아리 발표회 부스용 웹앱 모음. GitHub Pages로 배포됨.
배포 주소: https://getbetterwithu.github.io/ai-club-booth/

## 폴더 구조

```
ai-club-booth/
├── index.html              # 허브 페이지 (앱 목록 + 학생 작품존)
├── tarot/index.html        # 🔮 AI 타로 운세
├── quiz/index.html         # 🕵️ AI 진짜? 가짜? 퀴즈 (사진은 quiz/img/)
├── object/index.html       # 📸 AI 물건 맞추기 (카메라 필요)
├── emotion/index.html      # 😊 AI 표정 감정 분석기 (카메라 필요)
├── pose/index.html         # 🎮 AI 포즈 따라하기 (카메라 필요)
├── upload/index.html       # ⬆️ 학생 작품 업로드 페이지
└── student-works/
    ├── works.json          # 학생 작품 목록 (허브가 읽어서 카드로 보여줌)
    └── <slug>/index.html   # 업로드된 작품
```

## 학생 작품 올리기

허브의 **⬆️ 내 작품 올리기** → 학번(4자리)·이름·이모지·작품 이름 입력, HTML 파일 고르고 올리기. 1~2분 뒤 허브에 카드가 생김.

업로드 페이지는 브라우저에서 GitHub API로 이 레포에 직접 커밋한다. 그래서 토큰이 필요하고, **학생용 링크**로 나눠준다:

1. GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token
2. Repository access: `ai-club-booth` 하나만 / Permissions: **Contents: Read and write**
3. 만료일은 축제 끝난 다음 날로
4. 업로드 페이지 맨 아래 **🔧 선생님 메뉴 → 링크 만들기**에 토큰을 넣으면 `.../upload/#k=토큰` 링크가 복사됨
5. 이 링크를 동아리 단톡방에만 공유. 학생이 한 번 열면 그 기기에 저장되고 주소창에서 토큰은 지워짐

토큰을 코드에 넣어 커밋하면 GitHub이 자동으로 폐기하니 절대 커밋하지 말 것.

작품 바꾸기: 같은 학번+이름을 입력하면 "내가 올린 작품" 목록이 나오고, 고른 작품을 새 파일로 바꿔 올릴 수 있음 (주소는 그대로).

작품 내리기: 업로드 페이지 **🔧 선생님 메뉴 → 전체 작품 목록 불러오기 → 삭제**. (허브 목록과 파일 둘 다 지워짐, git 기록에는 남아서 복구 가능)

## 참고

- 카메라 쓰는 앱(object, emotion, pose)은 첫 실행 때 인터넷 필요
  (AI 라이브러리를 CDN에서 받아옴. 이후엔 캐시됨)
- tarot, quiz는 완전 오프라인 동작 (학생 작품 업로드는 인터넷 필요)
- 각 앱은 폴더째 복사하면 바로 배포 가능
