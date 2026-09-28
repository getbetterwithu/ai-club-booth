# 🎪 AI 제작반 체험 부스

동아리 발표회 부스용 웹앱 모음. GitHub Pages로 배포됨.
배포 주소: https://getbetterwithu.github.io/ai-club-booth/

## 폴더 구조

```
ai-booth/
├── index.html          # 허브 페이지 (앱 목록)
├── tarot/index.html    # 🔮 AI 타로 운세
├── quiz/index.html     # 🎨 AI 그림 퀴즈
├── object/index.html   # 📸 AI 물건 맞추기 (카메라 필요)
├── emotion/index.html  # 😊 AI 표정 감정 분석기 (카메라 필요)
├── pose/index.html     # 🎮 AI 포즈 따라하기 (카메라 필요)
└── student-works/      # 🎨 학생 작품 (앞으로 추가될 곳)
```

## 학생 작품 추가하는 방법 (3단계)

1. `student-works/` 안에 새 폴더를 만들고 `index.html`을 넣기
   예: `student-works/number-game/index.html`
2. `index.html`의 `STUDENT_WORKS` 배열에 한 줄 추가하기:
   ```js
   { title: '🎲 숫자 맞히기 게임', desc: '내가 만든 첫 AI 게임!', path: 'student-works/number-game/' },
   ```
3. push 하면 끝! 허브 페이지에 자동으로 카드가 생김

## 참고

- 카메라 쓰는 앱(object, emotion, pose)은 첫 실행 때 인터넷 필요
  (AI 라이브러리를 CDN에서 받아옴. 이후엔 캐시됨)
- tarot, quiz는 완전 오프라인 동작
- 각 앱은 단일 `index.html` 파일이라 폴더째 복사하면 바로 배포 가능
