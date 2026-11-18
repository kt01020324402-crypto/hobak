# 🎃 호박 (Hobak) — 우리 동네 따뜻한 중고거래

Vanilla HTML/CSS/JavaScript와 **Supabase (Database + Auth)**로 구축한 중고거래 웹 서비스입니다.

## 주요 기능
- **상품 목록**: 카테고리 필터, 검색, 정렬(`최신순`, `낮은 가격순`, `높은 가격순`, `인기순`), 거래 상태 태그(`판매중`, `예약중`, `거래완료`, `나눔 🧡`), 인기 검색어 사이드바, 페이지네이션
- **상품 상세**: 다중 이미지 캐러셀, 판매자 프로필 및 매너온도, 찜하기, 채팅 모달, 본인 게시글 수정·삭제·거래 상태 변경
- **글쓰기 / 수정**: 다중 이미지 업로드 미리보기, 판매/나눔 전환, 가격 제안 여부, 동네 선택 및 Supabase 실시간 저장
- **회원 인증**: Supabase Auth 기반 이메일/비밀번호 회원가입(닉네임 필수) 및 로그인, 비로그인 시 글쓰기 접근 제어

## 기술 스택
- **Frontend**: HTML5, CSS3 (Antigravity Glassmorphism & 3D Tilt UI), Vanilla JavaScript
- **Backend / BaaS**: Supabase PostgreSQL, Row Level Security (RLS), Supabase Auth

## 실행 방법
정적 파일 구조이므로 별도 빌드 없이 `index.html`을 웹 서버 또는 브라우저로 열면 바로 동작합니다.
(GitHub Pages, Vercel, Netlify 등 정적 호스팅에 그대로 배포 가능합니다.)
