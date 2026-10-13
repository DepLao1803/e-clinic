#!/usr/bin/env bash
# doctor.sh - Cong kiem dinh moi truong | Mon: Trien khai he thong phan mem
# Chay: bash doctor.sh
# Muc tieu: khong ai buoc sang Buoi 3 khi con FAIL.

set -uo pipefail

PASS=0; WARN=0; FAIL=0
G=$'\033[0;32m'; Y=$'\033[0;33m'; R=$'\033[0;31m'; B=$'\033[0;34m'; N=$'\033[0m'

ok()   { echo "  ${G}[PASS]${N} $1"; PASS=$((PASS+1)); }
warn() { echo "  ${Y}[WARN]${N} $1"; WARN=$((WARN+1)); }
bad()  { echo "  ${R}[FAIL]${N} $1"; FAIL=$((FAIL+1)); }
head_() { echo; echo "${B}== $1 ==${N}"; }

# ---------------------------------------------------------------- He dieu hanh
head_ "He dieu hanh & kien truc"

OS="$(uname -s)"; ARCH="$(uname -m)"
echo "  He dieu hanh: $OS | Kien truc: $ARCH"

case "$ARCH" in
  arm64|aarch64)
    warn "May ARM64. Image build tren may nay MAC DINH khong chay duoc tren VPS x86.
         Bat buoc hoc 'docker buildx' + multi-arch o Buoi 7. Ghi nhan voi giang vien." ;;
  x86_64|amd64) ok "Kien truc x86_64, trung voi VPS se dung o Module 3" ;;
  *) warn "Kien truc la: $ARCH" ;;
esac

if grep -qi microsoft /proc/version 2>/dev/null; then
  ok "Dang chay trong WSL"
  if [[ "$PWD" == /mnt/[a-z]/* ]]; then
    bad "Thu muc lam viec dang nam tren o Windows ($PWD).
         Day la nguyen nhan so 1 cua 'Docker cham qua'.
         KHAC PHUC: chuyen code vao ~/projects trong WSL."
  else
    ok "Thu muc lam viec nam trong he thong tep WSL"
  fi
fi

# ------------------------------------------------------------------- Tai nguyen
head_ "Tai nguyen phan cung"

RAM_GB=0
if command -v free >/dev/null 2>&1; then
  RAM_GB=$(free -g | awk '/^Mem:/{print $2}')
elif [[ "$OS" == "Darwin" ]]; then
  RAM_GB=$(( $(sysctl -n hw.memsize) / 1073741824 ))
fi

if   (( RAM_GB >= 16 )); then ok "RAM ${RAM_GB}GB"
elif (( RAM_GB >= 8  )); then warn "RAM ${RAM_GB}GB. Du hoc nhung se chat o Module 2. Dung compose.lite.yml khi can."
elif (( RAM_GB > 0   )); then bad "RAM ${RAM_GB}GB, khong du chay Compose nhieu dich vu. Chuyen sang dev container."
else warn "Khong doc duoc dung luong RAM"; fi

DISK_GB=$(df -Pg . 2>/dev/null | awk 'NR==2{print $4}' || df -BG . | awk 'NR==2{gsub("G","",$4); print $4}')
if   (( DISK_GB >= 40 )); then ok "Dung luong trong ${DISK_GB}GB"
elif (( DISK_GB >= 20 )); then warn "Chi con ${DISK_GB}GB. Image Docker se an rat nhanh. Don dep truoc Buoi 7."
else bad "Chi con ${DISK_GB}GB, khong du cho Module 2."; fi

# ------------------------------------------------------------------------- Git
head_ "Git"

if command -v git >/dev/null 2>&1; then
  ok "git $(git --version | awk '{print $3}')"
  [[ -n "$(git config --global user.name  || true)" ]] && ok "git user.name da dat"  || bad "Chua dat: git config --global user.name \"Ho Ten\""
  [[ -n "$(git config --global user.email || true)" ]] && ok "git user.email da dat" || bad "Chua dat: git config --global user.email \"email@truong.edu.vn\""
  EOLCFG=$(git config --global core.autocrlf || echo "")
  if [[ "$OS" == MINGW* || "$OS" == CYGWIN* ]] || grep -qi microsoft /proc/version 2>/dev/null; then
    [[ "$EOLCFG" == "input" || "$EOLCFG" == "false" ]] && ok "core.autocrlf = $EOLCFG" \
      || warn "Nen dat: git config --global core.autocrlf input (tranh loi CRLF trong container Linux)"
  fi
else
  bad "Chua cai Git"
fi

# --------------------------------------------------------------------- SSH key
head_ "SSH"

if ls ~/.ssh/id_ed25519.pub ~/.ssh/id_rsa.pub >/dev/null 2>&1; then
  ok "Da co SSH key"
  ls ~/.ssh/id_ed25519.pub >/dev/null 2>&1 || warn "Dang dung RSA. Nen tao them ed25519: ssh-keygen -t ed25519"
else
  bad "Chua co SSH key. Tao bang: ssh-keygen -t ed25519 -C \"email@truong.edu.vn\""
fi

if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=8 -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
  ok "SSH toi GitHub hoat dong"
else
  warn "Chua xac thuc duoc SSH toi GitHub. Them public key vao GitHub > Settings > SSH keys."
fi

# ---------------------------------------------------------------------- Docker
head_ "Docker"

if command -v docker >/dev/null 2>&1; then
  ok "docker $(docker --version | awk '{print $3}' | tr -d ,)"
  if docker info >/dev/null 2>&1; then
    ok "Docker daemon dang chay"
    docker compose version >/dev/null 2>&1 \
      && ok "docker compose $(docker compose version --short 2>/dev/null)" \
      || bad "Thieu 'docker compose' (plugin v2). Ban 'docker-compose' cu khong dung cho mon nay."
    docker buildx version >/dev/null 2>&1 \
      && ok "docker buildx san sang (can cho multi-arch o Buoi 7)" \
      || warn "Thieu buildx. Se can tu Buoi 7 neu may ARM."
    if docker run --rm hello-world >/dev/null 2>&1; then
      ok "Chay thu container thanh cong"
    else
      bad "Khong chay duoc container. Kiem tra quyen hoac ket noi mang."
    fi
  else
    bad "Docker da cai nhung daemon chua chay. Mo Docker Desktop hoac: sudo systemctl start docker"
  fi
else
  bad "Chua cai Docker. Xem SETUP.md phan danh cho he dieu hanh cua ban."
fi

# ------------------------------------------------------------------- Node & CC
head_ "Node.js & Claude Code"

if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
  (( NODE_MAJOR >= 20 )) && ok "node $(node -v)" || warn "node $(node -v) hoi cu, nen dung LTS tu v20 tro len"
else
  warn "Chua cai Node.js (chua bat buoc o Buoi 2)"
fi

if command -v claude >/dev/null 2>&1; then
  ok "Da cai Claude Code. Chay 'claude doctor' de kiem tra chi tiet."
else
  warn "Chua cai Claude Code. HAN CHOT: truoc Buoi 4."
fi

# -------------------------------------------------------------------- Cong cu
head_ "Cong cu dong lenh"
for t in curl dig jq make ssh rsync; do
  command -v "$t" >/dev/null 2>&1 && ok "$t" || warn "Thieu $t (se can trong cac buoi sau)"
done

# ------------------------------------------------------------------ Tong ket
echo
echo "${B}================ TONG KET ================${N}"
echo "  ${G}PASS: $PASS${N}   ${Y}WARN: $WARN${N}   ${R}FAIL: $FAIL${N}"
echo
if (( FAIL > 0 )); then
  echo "  ${R}CHUA QUA CONG.${N} Xu ly het cac muc FAIL truoc khi sang Buoi 3."
  echo "  Neu khong xu ly duoc tren may ca nhan: dung .devcontainer/ lam phuong an du phong."
  exit 1
elif (( WARN > 0 )); then
  echo "  ${Y}QUA CONG, co canh bao.${N} Ghi lai cac WARN, se anh huong tu Module 2."
  exit 0
else
  echo "  ${G}QUA CONG HOAN TOAN.${N}"
  exit 0
fi
