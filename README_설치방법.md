# 하루결 3.0 — 푸시 알림 서버 연결 버전

## 무엇이 바뀌었나요?
- 아이패드 홈 화면의 하루결에서 **푸시 알림 켜기** 버튼을 누르면 기기 구독을 서버에 저장합니다.
- **매일 한국시간 오전 8시**에 Netlify 예약 함수가 실행되어 **당일 또는 다음 날 마감**인 시험, 수행평가, ‘잊지 말기’ 항목을 알려 줍니다.
- 이미 완료한 수행평가나 메모, 날짜가 없는 항목, 일반 오늘 계획은 알림 대상이 아닙니다.
- 알림은 개별 시험/과제마다 여러 개가 아니라 해당 날짜의 **요약 알림 1건**입니다.
- 과거 공부 기록·시간표·계획은 이전처럼 기기 브라우저에 저장됩니다. **미완료 항목의 제목과 날짜, 알림용 기기 구독 정보만 Netlify Blobs 서버에 별도로 저장**합니다.

## 필수 설정 (기존 Netlify Drop ZIP 업로드만으로는 서버가 설치되지 않습니다)

1. 이 ZIP을 풀어서 **`public` 폴더, `netlify` 폴더, `netlify.toml`, `package.json`, `.nvmrc`**을 포함한 전체 프로젝트를 준비합니다.
2. GitHub 저장소에 이 프로젝트 파일을 올린 후 **Netlify 프로젝트 → Project configuration → Developer settings → Continuous deployment → Repository**에서 Git 연동합니다. 기존 사이트를 그대로 사용하면 기존 웹앱 주소/브라우저 기록이 유지됩니다. 또는 PC에서 Netlify CLI로 빌드 및 배포할 수 있습니다.
3. VAPID 키는 **아이패드에서도 생성 가능**합니다. 사이트 배포 후 `https://내-사이트.netlify.app/setup-vapid.html`을 열어 **새 알림 키 만들기**를 누르세요. (PC에서는 `npx web-push generate-vapid-keys`를 실행해도 됩니다.) **비밀키는 GitHub나 채팅에 공유하지 마세요.**
4. Netlify 사이트 설정에서 아래 3개 환경 변수를 **Functions 런타임**에서 사용하도록 지정합니다.
   - `VAPID_PUBLIC_KEY` = 생성한 Public Key
   - `VAPID_PRIVATE_KEY` = 생성한 Private Key (**비공개**) 
   - `VAPID_SUBJECT` = `mailto:본인-이메일주소` 형식
5. Netlify에서 배포/재배포합니다. `https://내-사이트.netlify.app/.netlify/functions/push-api` 주소가 `ready: true`와 `vapidPublicKey`를 반환하면 서버가 연결된 것입니다.
6. 아이패드 Safari에서 기존 웹사이트에 접속해 **공유 → 홈 화면에 추가**를 수행합니다. 홈 화면의 하루결 앱을 열고 **설정 → 푸시 알림 켜기 → 허용**을 누릅니다. 테스트 알림으로 확인하세요. iPadOS 16.4 이상 필요.

> **주의**: Netlify 계정 / GitHub 인증 / VAPID 비밀키 설정은 계정 소유자가 직접 해야 합니다. 이 ZIP 파일만으로 실제 서버가 켜진 것은 아닙니다. Netlify 무료 등급에서도 예약 함수가 지원되지만 계정 사용량에 따른 제한/과금은 확인이 필요합니다. 예약 실행/네트워크/기기 설정에 따라 알림이 지연되거나 누락될 수 있으니 중요한 마감은 캘린더 알림도 함께 사용해 주세요.

## 파일 구성
- `public/`: 기존 하루결 웹앱, 랏코 아이콘, manifest, 서비스 워커, 아이패드용 VAPID 키 생성 화면
- `netlify/functions/push-api.mjs`: 구독 등록, 일정 동기화, 알림 끄기, 테스트 발송
- `netlify/functions/push-daily.mjs`: 매일 한국 시간 오전 8시 마감 일정 알림
- `netlify/functions/_push-common.mjs`: 서버 검증 및 저장 공통 코드
- `netlify.toml`, `package.json`, `.nvmrc`: Netlify 빌드/함수 설정

## 문제 해결
- **서버 연결 필요**: 단순 ZIP 드롭 배포가 아니라 Git 또는 Netlify CLI 배포인지, Functions 환경 변수 3개가 들어 있는지 확인합니다.
- **알림 버튼을 눌렀는데 허용 창이 안 뜸**: iPadOS에서 반드시 ‘홈 화면에 추가’한 웹앱을 열고 버튼을 누르세요.
- **테스트 알림 실패**: Netlify Functions 로그에서 `push-api` 오류 확인, VAPID 공개/비밀키 일치 확인.
- **일정이 바뀌었는데 반영되지 않음**: 기기가 인터넷에 연결된 상태에서 앱을 열어 동기화가 성공하도록 해 주세요. 오프라인에서 수정한 내용은 서버가 즉시 알 수 없습니다.
- **예약 알림 미수신**: Netlify Functions 페이지에서 `push-daily`의 실행 기록을 확인합니다. 오전 8시(Asia/Seoul)에 실행되도록 UTC 23:00으로 설정돼 있습니다.

공식 문서:
- https://docs.netlify.com/build/functions/get-started/
- https://docs.netlify.com/build/functions/scheduled-functions/
- https://docs.netlify.com/build/data-and-storage/netlify-blobs/
- https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
